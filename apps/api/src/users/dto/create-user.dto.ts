import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional, IsEnum, IsIn } from 'class-validator';
import { UserRole } from '@potential-unicorn/types';

export const AGE_GROUPS = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'] as const;
export type AgeGroup = (typeof AGE_GROUPS)[number];

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPassword123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  fullName: string;

  @ApiProperty({ enum: ['user', 'advertiser', 'admin'], required: false, default: 'user' })
  @IsOptional()
  @IsEnum(['user', 'advertiser', 'admin'])
  role?: UserRole;

  @ApiProperty({ example: 'Nepal', required: false })
  @IsOptional()
  @IsString()
  countryOfResidence?: string;

  @ApiProperty({ enum: AGE_GROUPS, required: false })
  @IsOptional()
  @IsIn(AGE_GROUPS)
  ageGroup?: AgeGroup;

  @ApiProperty({ example: '+977-9841234567', required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}
