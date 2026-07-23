import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository } from 'typeorm';
  import { Order, OrderStatus } from '../orders/order.entity';
  import { User } from '../users/user.entity';
  import { CreateReviewDto } from './dto/create-review.dto';
  import { Review } from './review.entity';
  
  @Injectable()
  export class ReviewsService {
    constructor(
      @InjectRepository(Review)
      private readonly reviewRepository: Repository<Review>,
      @InjectRepository(Order)
      private readonly orderRepository: Repository<Order>,
      @InjectRepository(User)
      private readonly userRepository: Repository<User>,
    ) {}
  
    async create(dto: CreateReviewDto, buyerId: string): Promise<Review> {
      // 1. Load order
      const order = await this.orderRepository.findOne({ where: { id: dto.orderId } });
      if (!order) {
        throw new NotFoundException('Order not found');
      }
  
      // Verify buyerId matches
      if (order.buyerId !== buyerId) {
        throw new UnauthorizedException('You can only review your own orders');
      }
  
      // Verify status = COMPLETED (returns 400 Bad Request if not completed)
      if (order.status !== OrderStatus.COMPLETED) {
        throw new BadRequestException('Reviews can only be submitted for COMPLETED orders');
      }
  
      // 2. Check if a review already exists for this orderId (returns 409 Conflict)
      const existingReview = await this.reviewRepository.findOne({ where: { orderId: dto.orderId } });
      if (existingReview) {
        throw new ConflictException('A review already exists for this order');
      }
  
      // 3. Save review
      const review = this.reviewRepository.create({
        orderId: dto.orderId,
        buyerId,
        sellerId: order.supplierId,
        rating: dto.rating,
        comment: dto.comment,
      });
      const savedReview = await this.reviewRepository.save(review);
  
      // 4. Recalculate seller averageRating and reviewCount using QueryBuilder
      const stats = await this.reviewRepository
        .createQueryBuilder('review')
        .select('AVG(review.rating)', 'avgRating')
        .addSelect('COUNT(*)', 'count')
        .where('review.sellerId = :sellerId', { sellerId: order.supplierId })
        .getRawOne();
  
      const newAvgRating = parseFloat(stats.avgRating) || 0;
      const newCount = parseInt(stats.count, 10) || 0;
  
      // 5. Update seller user record
      await this.userRepository.update(order.supplierId, {
        averageRating: Number(newAvgRating.toFixed(2)),
        reviewCount: newCount,
      });
  
      return savedReview;
    }
  
    async findBySellerId(sellerId: string, page = 1, limit = 10) {
      const skip = (page - 1) * limit;
  
      const [data, total] = await this.reviewRepository.findAndCount({
        where: { sellerId },
        relations: ['buyer'],
        order: { createdAt: 'DESC' },
        take: limit,
        skip,
      });
  
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
  }