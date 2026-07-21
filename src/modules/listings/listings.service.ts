import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Listing } from './listing.entity';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { S3UploadService } from './s3-upload.service';
import { EventPublisherService } from '../../messaging/event-publisher.service'; // Make sure this path matches your file structure

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
}