import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsUrl } from 'class-validator';

export class CreateBusinessDto {
  @ApiProperty({ example: 'Acme Corporation' })
  @IsString()
  businessName: string;

  @ApiProperty({ example: 'REG-12345', required: false })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiProperty({ example: '123 Business Street', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'Kathmandu', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: 'Nepal', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ example: '+977-1-1234567', required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ example: 'business@example.com', required: false })
  @IsOptional()
  @IsEmail()
  businessEmail?: string;

  @ApiProperty({ example: 'https://example.com', required: false })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiProperty({ example: 'A leading company in...', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'Technology', required: false })
  @IsOptional()
  @IsString()
  businessType?: string;
}
