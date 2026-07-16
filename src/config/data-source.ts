import { DataSource } from 'typeorm';
import { User } from '../modules/users/user.entity';
import { Listing } from '../modules/listings/listing.entity';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Force an absolute path lookup to the root .env file from src/config/
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [User, Listing],
  synchronize: false,
  migrations: ['migrations/*{.ts,.js}'], // Tells CLI where to put/find files
});