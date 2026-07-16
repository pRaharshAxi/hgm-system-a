import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../modules/users/user.entity';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [User],
    autoLoadEntities: true, // <-- ADD THIS LINE HERE
    synchronize: false, // Production safety target
    migrations: ['dist/migrations/*{.ts,.js}'],
    logging: process.env.NODE_ENV === 'development',
  }),
);