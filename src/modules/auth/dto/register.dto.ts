import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export enum UserRole {
  SUPPLIER = 'SUPPLIER',
  BUYER = 'BUYER',
  ADMIN = 'ADMIN',
}

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(UserRole, { message: 'Role must be SUPPLIER, BUYER, or ADMIN' })
  role: UserRole;

  @IsString()
  @IsOptional()
  address?: string;
}