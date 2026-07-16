import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from './config/database.config';
import { envValidationSchema } from './config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { ListingsModule } from './modules/listings/listings.module'; // Add this import

@Module({
  imports: [
    // 1. Core Config Setup with Strict Joi Schema Validation
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      validationSchema: envValidationSchema,
      validationOptions: {
        allowUnknown: true, // Safeguards against built-in machine env injection
        abortEarly: true,   // Instantly stops compilation on first failure
      },
    }),

    // 2. Asynchronous Async Injection for Database Connection
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.get('database'),
    }),

    // 3. Auth Module
    AuthModule,

    // 4. Listings Module - Connect listings here
    ListingsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}