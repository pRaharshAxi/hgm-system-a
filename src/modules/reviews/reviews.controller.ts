import { Controller, Post, Get, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/auth.guard'; // or '../../modules/auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../auth/dto/register.dto'; // or import UserRole from your user entity/enum

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUYER) 
  @Post()
  async create(@Body() dto: CreateReviewDto, @Req() req: any) {
    return this.reviewsService.create(dto, req.user.id);
  }

  @Get(':sellerId')
  async findBySeller(
    @Param('sellerId') sellerId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.reviewsService.findBySellerId(sellerId, Number(page), Number(limit));
  }
}