import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Listing } from './listing.entity';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { S3UploadService } from './s3-upload.service';
import { EventPublisherService } from '../../messaging/event-publisher.service'; // Make sure this path matches your file structure
import { AdminListingQueryDto } from './dto/admin-listing-query.dto';

@Injectable()
export class ListingsService {
  constructor(
    @InjectRepository(Listing)
    private readonly listingRepository: Repository<Listing>,
    private readonly s3UploadService: S3UploadService,
    private readonly eventPublisher: EventPublisherService, // 1. Inject the EventPublisher
  ) {}

  async create(dto: CreateListingDto, supplierId: string): Promise<Listing> {
    const listing = this.listingRepository.create({
      ...dto,
      supplierId,
    });
    
    const savedListing = await this.listingRepository.save(listing);

    // 2. Publish Listing Created Event
    // Note: If you need to include real supplierName, fetch it or extract it if available.
    // Passing the saved listing structure to fulfill the payload shape rules.
    await this.eventPublisher.publishListingCreated({
      ...savedListing,
      supplierName: 'Supplier Account', // Placeholder or add field if user object is accessible
    });

    return savedListing;
  }

  async findAll(): Promise<Listing[]> {
    return this.listingRepository.find({ where: { isActive: true } });
  }

  async findBySupplier(supplierId: string): Promise<Listing[]> {
    return this.listingRepository.find({ where: { supplierId, isActive: true } });
  }

  async findOne(id: string): Promise<Listing> {
    const listing = await this.listingRepository.findOne({ where: { id, isActive: true } });
    if (!listing) {
      throw new NotFoundException(`Listing with ID ${id} not found`);
    }
    return listing;
  }

  async update(id: string, dto: UpdateListingDto, supplierId: string): Promise<Listing> {
    const listing = await this.findOne(id);
    
    if (listing.supplierId !== supplierId) {
      throw new ForbiddenException('You do not own this catalog listing entry');
    }

    Object.assign(listing, dto);
    const updatedListing = await this.listingRepository.save(listing);

    // 3. Publish Listing Updated Event
    await this.eventPublisher.publishListingUpdated({
      ...updatedListing,
      supplierName: 'Supplier Account',
    });

    return updatedListing;
  }

  async softDelete(id: string, supplierId: string): Promise<{ success: boolean }> {
    const listing = await this.findOne(id);

    if (listing.supplierId !== supplierId) {
      throw new ForbiddenException('You do not own this catalog listing entry');
    }

    listing.isActive = false;
    await this.listingRepository.save(listing);

    // 4. Publish Listing Deleted Event (Passes just the string ID per instructions)
    await this.eventPublisher.publishListingDeleted(id);

    return { success: true };
  }

  async getPresignedUrl(filename: string, contentType: string) {
    return this.s3UploadService.generateUploadPresignedUrl(filename, contentType);
  }

  async findAllAdmin(query: AdminListingQueryDto) {
    const { category, isActive, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
  
    const qb = this.listingRepository.createQueryBuilder('listing');
  
    if (category) {
      qb.andWhere('listing.category = :category', { category });
    }
  
    if (isActive !== undefined) {
      qb.andWhere('listing.isActive = :isActive', { isActive });
    }
  
    qb.skip(skip).take(limit).orderBy('listing.createdAt', 'DESC');
  
    const [data, total] = await qb.getManyAndCount();
  
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  
  async disableListing(id: string) {
    const listing = await this.listingRepository.findOneBy({ id });
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }
    listing.isActive = false;
    return this.listingRepository.save(listing);
  }


}