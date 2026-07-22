import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  import { DataSource } from 'typeorm';
  import { Order, OrderStatus } from './order.entity';
  import { OrderItem } from './order-item.entity';
  import { Listing } from '../listings/listing.entity';
  import { CreateOrderDto } from './dto/create-order.dto';
  import { EventPublisherService } from '../../messaging/event-publisher.service';
  
  @Injectable()
  export class OrdersService {
    constructor(
      private readonly dataSource: DataSource,
      private readonly eventPublisher: EventPublisherService,
    ) {}
  
    async placeOrder(dto: CreateOrderDto, buyerId: string): Promise<Order> {
      if (!dto.items || dto.items.length === 0) {
        throw new BadRequestException('Order must contain at least one item.');
      }
  
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
  
      try {
        let totalAmount = 0;
        let supplierId: string | null = null;
        const orderItemsToCreate: Partial<OrderItem>[] = [];
  
        for (const item of dto.items) {
          // 1. SELECT listing FOR UPDATE (row lock)
          const listing = await queryRunner.manager
            .createQueryBuilder(Listing, 'listing')
            .setLock('pessimistic_write')
            .where('listing.id = :id', { id: item.listingId })
            .getOne();
  
          if (!listing) {
            throw new NotFoundException(`Listing with ID ${item.listingId} not found.`);
          }
  
          if (!listing.isActive) {
            throw new BadRequestException(`Listing "${listing.title}" is no longer active.`);
          }
  
          if (listing.quantity < item.quantity) {
            throw new BadRequestException(
              `Insufficient stock for listing "${listing.title}". Available: ${listing.quantity}, requested: ${item.quantity}.`,
            );
          }
  
          if (!supplierId) {
            supplierId = listing.supplierId;
          } else if (supplierId !== listing.supplierId) {
            throw new BadRequestException('All items in a single order must belong to the same supplier.');
          }
  
          const subtotal = Number(listing.price) * item.quantity;
          totalAmount += subtotal;
  
          orderItemsToCreate.push({
            listingId: listing.id,
            quantity: item.quantity,
            unitPrice: Number(listing.price),
            subtotal: subtotal,
            listingTitle: listing.title,
          });
  
          // 3. Decrement stock atomically
          const newQuantity = listing.quantity - item.quantity;
          const isActive = newQuantity > 0;
  
          await queryRunner.manager.update(Listing, listing.id, {
            quantity: newQuantity,
            isActive: isActive,
          });
        }
  
        // 2. Create Order & OrderItems
        const order = queryRunner.manager.create(Order, {
          buyerId,
          supplierId: supplierId!,
          status: OrderStatus.PLACED,
          totalAmount,
          deliveryAddress: dto.deliveryAddress,
          notes: dto.notes,
        });
  
        const savedOrder = await queryRunner.manager.save(Order, order);
  
        const items = orderItemsToCreate.map((item) =>
          queryRunner.manager.create(OrderItem, {
            ...item,
            orderId: savedOrder.id,
          }),
        );
  
        savedOrder.items = await queryRunner.manager.save(OrderItem, items);
  
        // 5. Commit Transaction
        await queryRunner.commitTransaction();
  
        // Publish RabbitMQ Event
        await this.eventPublisher.publishOrderPlaced({
          orderId: savedOrder.id,
          buyerId: savedOrder.buyerId,
          supplierId: savedOrder.supplierId,
          totalAmount: savedOrder.totalAmount,
          items: savedOrder.items,
        });
  
        return savedOrder;
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    }
  
    async findOne(id: string, userId: string): Promise<Order> {
      const order = await this.dataSource.getRepository(Order).findOne({
        where: { id },
        relations: ['items', 'buyer', 'supplier'],
      });
  
      if (!order) {
        throw new NotFoundException(`Order with ID ${id} not found.`);
      }
  
      if (order.buyerId !== userId && order.supplierId !== userId) {
        throw new ForbiddenException('You are not authorized to view this order.');
      }
  
      return order;
    }
  
    async findAllByUser(userId: string, role: 'buyer' | 'supplier', page = 1, limit = 10) {
      const query = this.dataSource.getRepository(Order).createQueryBuilder('order')
        .leftJoinAndSelect('order.items', 'items');
  
      if (role === 'buyer') {
        query.where('order.buyerId = :userId', { userId });
      } else {
        query.where('order.supplierId = :userId', { userId });
      }
  
      query.orderBy('order.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit);
  
      const [data, total] = await query.getManyAndCount();
  
      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }
  
    async updateStatus(
      orderId: string,
      newStatus: OrderStatus,
      actorId: string,
      actorRole: string,
    ): Promise<Order> {
      const orderRepo = this.dataSource.getRepository(Order);
      const order = await orderRepo.findOne({ where: { id: orderId } });
  
      if (!order) {
        throw new NotFoundException(`Order with ID ${orderId} not found.`);
      }
  
      const currentStatus = order.status;
      const isSupplier = order.supplierId === actorId || actorRole === 'SUPPLIER';
      const isBuyer = order.buyerId === actorId || actorRole === 'BUYER';
  
      let isValid = false;
  
      if (isSupplier) {
        if (currentStatus === OrderStatus.PLACED && newStatus === OrderStatus.CONFIRMED) isValid = true;
        if (currentStatus === OrderStatus.PLACED && newStatus === OrderStatus.CANCELLED) isValid = true;
        if (currentStatus === OrderStatus.CONFIRMED && newStatus === OrderStatus.FULFILLED) isValid = true;
      }
  
      if (isBuyer) {
        if (currentStatus === OrderStatus.CONFIRMED && newStatus === OrderStatus.CANCELLED) {
          const hoursDiff = (new Date().getTime() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60);
          if (hoursDiff < 1) {
            isValid = true;
          } else {
            throw new BadRequestException('Buyers can only cancel confirmed orders within 1 hour of creation.');
          }
        }
        if (currentStatus === OrderStatus.FULFILLED && newStatus === OrderStatus.COMPLETED) isValid = true;
      }
  
      if (!isValid) {
        throw new ForbiddenException(
          `Transition from ${currentStatus} to ${newStatus} is not permitted for your role.`,
        );
      }
  
      order.status = newStatus;
      const updatedOrder = await orderRepo.save(order);
  
      await this.eventPublisher.publishOrderStatusUpdated({
        orderId: updatedOrder.id,
        status: updatedOrder.status,
        actorId,
      });
  
      return updatedOrder;
    }
  }