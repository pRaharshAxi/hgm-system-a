import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from './config/database.config';
import { envValidationSchema } from './config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { ListingsModule } from './modules/listings/listings.module';
import { MessagingModule } from './messaging/messaging.module';
import { OrdersModule } from './modules/orders/orders.module'; // 👈 1. Import OrdersModule
import { ReviewsModule } from './modules/reviews/reviews.module'; // 👈 1. Import ReviewsModule

@Module({
  imports: [
    // 1. Core Config Setup
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      validationSchema: envValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),

    // 2. Database Connection
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.get('database'),
    }),

    // 3. Feature Modules
    AuthModule,
    ListingsModule,
    OrdersModule, // 👈 2. Add OrdersModule here!
    ReviewsModule,
    MessagingModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}