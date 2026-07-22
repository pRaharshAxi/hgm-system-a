import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Listing } from '../listings/listing.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { MessagingModule } from '../../messaging/messaging.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Listing]),
    MessagingModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}