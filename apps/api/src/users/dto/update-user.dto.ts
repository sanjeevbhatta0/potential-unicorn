import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, ValidateNested, IsBoolean, IsArray, IsEnum } from 'class-validator';
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

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @ApiProperty({ required: false, type: UserPreferencesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserPreferencesDto)
  preferences?: Partial<UserPreferencesDto>;
}
