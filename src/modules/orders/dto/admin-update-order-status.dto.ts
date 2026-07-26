import { IsEnum, IsNotEmpty } from 'class-validator';
import { OrderStatus } from '../order.entity';

export class AdminUpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  @IsNotEmpty()
  status: OrderStatus;
}