import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessEntity } from '../database/entities/business.entity';
import { UsersService } from '../users/users.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Injectable()
export class BusinessService {
  constructor(
    @InjectRepository(BusinessEntity)
    private readonly businessRepository: Repository<BusinessEntity>,
    private readonly usersService: UsersService,
  ) {}

  async create(
    userId: string,
    createBusinessDto: CreateBusinessDto,
  ): Promise<BusinessEntity> {
    // Check if user already has a business
    const existingBusiness = await this.businessRepository.findOne({
      where: { userId },
    });

    if (existingBusiness) {
      throw new ConflictException('User already has a registered business');
    }

    // Create business
    const business = this.businessRepository.create({
      ...createBusinessDto,
      userId,
    });

    const savedBusiness = await this.businessRepository.save(business);

    // Update user account type to 'business'
    await this.usersService.update(userId, { accountType: 'business' });

    return savedBusiness;
  }

  async findByUserId(userId: string): Promise<BusinessEntity | null> {
    return this.businessRepository.findOne({
      where: { userId },
    });
  }

  async update(
    userId: string,
    updateBusinessDto: UpdateBusinessDto,
  ): Promise<BusinessEntity> {
    const business = await this.businessRepository.findOne({
      where: { userId },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    Object.assign(business, updateBusinessDto);
    return this.businessRepository.save(business);
  }

  async findOne(id: string): Promise<BusinessEntity> {
    const business = await this.businessRepository.findOne({
      where: { id },
    });

    if (!business) {
      throw new NotFoundException(`Business with ID ${id} not found`);
    }

    return business;
  }
}
