import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

export enum ListingCategory {
  FRUITS = 'FRUITS',
  VEGETABLES = 'VEGETABLES',
  HERBS = 'HERBS',
  SPICES = 'SPICES',
  LEAFY_GREENS = 'LEAFY_GREENS',
  OTHER = 'OTHER',
}

export enum ListingUnit {
  KG = 'kg',
  G = 'g',
  PIECE = 'piece',
  BUNCH = 'bunch',
  LITRE = 'litre',
}

@Entity('listings')
export class Listing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ListingCategory })
  category: ListingCategory;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({ type: 'enum', enum: ListingUnit })
  unit: ListingUnit;

  @Column({ type: 'text', array: true, default: '{}' })
  images: string[];

  @Column({ type: 'uuid' })
  supplierId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'supplierId' })
  supplier: User;

  @Column({ type: 'decimal', precision: 9, scale: 6 })
  latitude: number;

  @Column({ type: 'decimal', precision: 9, scale: 6 })
  longitude: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}