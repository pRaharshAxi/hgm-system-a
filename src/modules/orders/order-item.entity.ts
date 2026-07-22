import {
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    JoinColumn,
  } from 'typeorm';
  import { Order } from './order.entity';
  import { Listing } from '../listings/listing.entity';
  
  @Entity('order_items')
  export class OrderItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ type: 'uuid' })
    orderId: string;
  
    @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'orderId' })
    order: Order;
  
    @Column({ type: 'uuid' })
    listingId: string;
  
    @ManyToOne(() => Listing)
    @JoinColumn({ name: 'listingId' })
    listing: Listing;
  
    @Column({ type: 'int' })
    quantity: number;
  
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    unitPrice: number;
  
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    subtotal: number;
  
    @Column({ type: 'varchar', length: 255 })
    listingTitle: string;
  }