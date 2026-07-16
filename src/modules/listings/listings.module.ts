import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListingsService } from './listings.service';
import { ListingsController } from './listings.controller';
import { Listing } from './listing.entity';
import { S3UploadService } from './s3-upload.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Listing]),
    AuthModule, // Imports passport protection contexts
  ],
  providers: [ListingsService, S3UploadService],
  controllers: [ListingsController],
})
export class ListingsModule {}