import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
    Unique,
  } from 'typeorm';
  import { Order } from '../orders/order.entity';
  import { User } from '../users/user.entity';
  
  @Entity('reviews')
  @Unique(['orderId'])
  export class Review {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ type: 'uuid' })
    orderId: string;
  
    @OneToOne(() => Order)
    @JoinColumn({ name: 'orderId' })
    order: Order;
  
    @Column({ type: 'uuid' })
    buyerId: string;
  
    @ManyToOne(() => User)
    @JoinColumn({ name: 'buyerId' })
    buyer: User;
  
    @Column({ type: 'uuid' })
    sellerId: string;
  
    @ManyToOne(() => User)
    @JoinColumn({ name: 'sellerId' })
    seller: User;
  
    @Column({ type: 'int' })
    rating: number;
  
    @Column({ type: 'text', nullable: true })
    comment: string;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  }