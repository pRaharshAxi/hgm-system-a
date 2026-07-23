import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
    Query,
    UseGuards,
    Request,
  } from '@nestjs/common';
  import { JwtAuthGuard } from '../auth/auth.guard';
  import { RolesGuard } from '../auth/roles.guard';
  import { Roles } from '../../common/decorators/roles.decorator';
  import { UserRole } from '../users/user.entity';
  import { CreateReviewDto } from './dto/create-review.dto';
  import { ReviewsService } from './reviews.service';
  
  @Controller('reviews')
  export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) {}
  
    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.BUYER)
    async create(@Request() req: any, @Body() dto: CreateReviewDto) {
      return this.reviewsService.create(dto, req.user.id);
    }
  
    @Get(':sellerId')
    async findBySellerId(
      @Param('sellerId', ParseUUIDPipe) sellerId: string,
      @Query('page') page = 1,
      @Query('limit') limit = 10,
    ) {
      return this.reviewsService.findBySellerId(sellerId, Number(page), Number(limit));
    }
  }