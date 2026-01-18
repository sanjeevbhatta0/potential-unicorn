import { Controller, Get, Post, Body, Patch } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BusinessService } from './business.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserEntity } from '../database/entities/user.entity';

@ApiTags('business')
@Controller('business')
@ApiBearerAuth('JWT-auth')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new business' })
  @ApiResponse({ status: 201, description: 'Business registered successfully' })
  @ApiResponse({ status: 409, description: 'User already has a business' })
  create(
    @CurrentUser() user: UserEntity,
    @Body() createBusinessDto: CreateBusinessDto,
  ) {
    return this.businessService.create(user.id, createBusinessDto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user business' })
  @ApiResponse({ status: 200, description: 'Business retrieved successfully' })
  findMyBusiness(@CurrentUser() user: UserEntity) {
    return this.businessService.findByUserId(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user business' })
  @ApiResponse({ status: 200, description: 'Business updated successfully' })
  update(
    @CurrentUser() user: UserEntity,
    @Body() updateBusinessDto: UpdateBusinessDto,
  ) {
    return this.businessService.update(user.id, updateBusinessDto);
  }
}
