import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../modules/users/user.entity';
import { Listing } from '../modules/listings/listing.entity';
import { Order } from '../modules/orders/order.entity';
import { OrderItem } from '../modules/orders/order-item.entity';
import { Review } from '../modules/reviews/review.entity';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
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
);