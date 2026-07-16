import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../auth/dto/register.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get('presigned-url')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPPLIER)
  async getUploadUrl(
    @Query('filename') filename: string,
    @Query('contentType') contentType: string,
  ) {
    return this.listingsService.getPresignedUrl(filename, contentType);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPPLIER)
  async create(@Body() dto: CreateListingDto, @CurrentUser() user: any) {
    return this.listingsService.create(dto, user.id);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPPLIER)
  async findMyListings(@CurrentUser() user: any) {
    return this.listingsService.findBySupplier(user.id);
  }

  @Get()
  async findAll() {
    return this.listingsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.listingsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPPLIER)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateListingDto,
    @CurrentUser() user: any,
  ) {
    return this.listingsService.update(id, dto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPPLIER)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.listingsService.softDelete(id, user.id);
  }
}