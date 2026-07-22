import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    JoinColumn,
  } from 'typeorm';
  import { User } from '../users/user.entity';
  import { OrderItem } from './order-item.entity';
  
  export enum OrderStatus {
    PLACED = 'PLACED',
    CONFIRMED = 'CONFIRMED',
    FULFILLED = 'FULFILLED',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
  }
  
  @Entity('orders')
  export class Order {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ type: 'uuid' })
    buyerId: string;
  
    @ManyToOne(() => User)
    @JoinColumn({ name: 'buyerId' })
    buyer: User;
  
    @Column({ type: 'uuid' })
    supplierId: string;
  
    @ManyToOne(() => User)
    @JoinColumn({ name: 'supplierId' })
    supplier: User;
  
    @Column({
      type: 'enum',
      enum: OrderStatus,
      default: OrderStatus.PLACED,
    })
    status: OrderStatus;
  
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    totalAmount: number;
  
    @Column({ type: 'text' })
    deliveryAddress: string;
  
    @Column({ type: 'text', nullable: true })
    notes: string;
  
    @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
    items: OrderItem[];
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }