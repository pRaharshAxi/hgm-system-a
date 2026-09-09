import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './review.entity';
import { Order } from '../orders/order.entity';
import { User } from '../users/user.entity';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(dto: CreateReviewDto, buyerId: string): Promise<Review> {
    const { orderId, rating, comment } = dto;

    // 1. Load order & verify authorization and COMPLETED status
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.buyerId !== buyerId) {
      throw new BadRequestException('You can only review your own orders');
    }

    if (order.status !== 'COMPLETED') {
      throw new BadRequestException('Order must be COMPLETED before leaving a review');
    }

    // 2. Check if a review already exists for this order
    const existingReview = await this.reviewRepository.findOne({ where: { orderId } });
    if (existingReview) {
      throw new ConflictException('A review has already been submitted for this order');
    }

    // 3. Save review
    const review = this.reviewRepository.create({
      orderId,
      buyerId,
      sellerId: order.supplierId,
      rating,
      comment,
    });
    const savedReview = await this.reviewRepository.save(review);

    // 4. Recalculate seller rating and count
    const { avgRating, count } = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avgRating')
      .addSelect('COUNT(*)', 'count')
      .where('review.sellerId = :sellerId', { sellerId: order.supplierId })
      .getRawOne();

    // 5. Update user table
    const numericAvg = parseFloat(avgRating) || 0;
    const numericCount = parseInt(count, 10) || 0;

    await this.userRepository.update(order.supplierId, {
      averageRating: Number(numericAvg.toFixed(2)),
      reviewCount: numericCount,
    });

    return savedReview;
  }

  async findBySellerId(sellerId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await this.reviewRepository.findAndCount({
      where: { sellerId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
      relations: ['buyer'],
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}