import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../auth/auth.guard'; 
import { RolesGuard } from '../auth/roles.guard'; 
import { Roles } from '../../common/decorators/roles.decorator'; 
import { UserRole } from '../users/user.entity';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(UserRole.BUYER)
  async placeOrder(@Body() dto: CreateOrderDto, @Request() req: any) {
    return this.ordersService.placeOrder(dto, req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.findOne(id, req.user.id);
  }

  @Get()
  async findAll(
    @Query('role') role: 'buyer' | 'supplier',
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Request() req: any,
  ) {
    if (!role || (role !== 'buyer' && role !== 'supplier')) {
      throw new ForbiddenException('Query parameter "role" must be either "buyer" or "supplier".');
    }
    return this.ordersService.findAllByUser(req.user.id, role, Number(page), Number(limit));
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @Request() req: any,
  ) {
    return this.ordersService.updateStatus(
      id,
      dto.status,
      req.user.id,
      req.user.role,
    );
  }
}