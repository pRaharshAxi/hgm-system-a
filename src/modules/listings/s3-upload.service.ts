import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3UploadService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      region: 'us-east-1',
      endpoint: 'http://localhost:9000',
      credentials: {
        accessKeyId: this.configService.get<string>('MINIO_ROOT_USER') || 'minioadmin',
        secretAccessKey: this.configService.get<string>('MINIO_ROOT_PASSWORD') || 'minioadmin',
      },
      forcePathStyle: true,
    });

    this.bucketName = this.configService.get<string>('MINIO_BUCKET_NAME') || 'hgm-images';
  }

  async generateUploadPresignedUrl(filename: string, contentType: string) {
    try {
      const fileExtension = filename.split('.').pop();
      const uniqueKey = `${uuidv4()}.${fileExtension}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: uniqueKey,
        ContentType: contentType,
      });

      const presignedUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 900 });

      return {
        url: presignedUrl,
        key: uniqueKey,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to generate secure object upload key signatures');
    }
  }
}