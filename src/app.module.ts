import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { envValidationSchema } from './config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { ListingsModule } from './modules/listings/listings.module';
import { MessagingModule } from './messaging/messaging.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';
import { User } from './modules/users/user.entity';
import { Listing } from './modules/listings/listing.entity';
import { Order } from './modules/orders/order.entity';
import { OrderItem } from './modules/orders/order-item.entity';
import { Review } from './modules/reviews/review.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'postgres',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      username: process.env.DB_USERNAME || 'hgm_user',
      password: process.env.DB_PASSWORD || 'hgm_password',
      database: process.env.DB_NAME || 'hgm_system_a',
      entities: [User, Listing, Order, OrderItem, Review],
      synchronize: true,
      logging: true,
    }),

    AuthModule,
    ListingsModule,
    OrdersModule,
    ReviewsModule,
    MessagingModule,
    HealthModule,
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}