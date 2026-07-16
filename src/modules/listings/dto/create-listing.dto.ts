import { IsEnum, IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min, IsUUID } from 'class-validator';
import { ListingCategory, ListingUnit } from '../listing.entity';

export class CreateListingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ListingCategory, { message: 'Invalid category choice' })
  category: ListingCategory;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  price: number;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsEnum(ListingUnit, { message: 'Invalid metric unit specification' })
  unit: ListingUnit;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}