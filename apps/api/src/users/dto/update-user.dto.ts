import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, ValidateNested, IsBoolean, IsArray, IsEnum, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

class UserPreferencesDto {
  @ApiProperty({ enum: ['ne', 'en'], required: false })
  @IsOptional()
  @IsEnum(['ne', 'en'])
  language?: 'ne' | 'en';

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sources?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;
}

export const AGE_GROUPS = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'] as const;
export type AgeGroup = (typeof AGE_GROUPS)[number];

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

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

  @ApiProperty({ enum: ['general', 'business'], required: false })
  @IsOptional()
  @IsIn(['general', 'business'])
  accountType?: 'general' | 'business';

  @ApiProperty({ required: false, type: UserPreferencesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserPreferencesDto)
  preferences?: Partial<UserPreferencesDto>;
}
