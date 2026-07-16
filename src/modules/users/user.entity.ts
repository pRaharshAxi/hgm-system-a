import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
  } from 'typeorm';
  
  export enum UserRole {
    SUPPLIER = 'SUPPLIER',
    BUYER = 'BUYER',
    ADMIN = 'ADMIN',
  }
  
  @Entity('users')
  export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ type: 'varchar', length: 255 })
    name: string;
  
    @Column({ type: 'varchar', length: 255, unique: true })
    email: string;
  
    @Column({ type: 'varchar', length: 255 })
    passwordHash: string;
  
    @Column({
      type: 'enum',
      enum: UserRole,
      default: UserRole.BUYER,
    })
    role: UserRole;
  
    @Column({ type: 'varchar', length: 50, nullable: true })
    phone: string;
  
    @Column({ type: 'text', nullable: true })
    address: string;
  
    @Column({
      type: 'decimal',
      precision: 3,
      scale: 2,
      default: 0.0,
      name: 'average_rating',
    })
    averageRating: number;
  
    @Column({ type: 'int', default: 0, name: 'review_count' })
    reviewCount: number;
  
    @Column({ type: 'boolean', default: true, name: 'is_active' })
    isActive: boolean;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updated_at: Date;
  }