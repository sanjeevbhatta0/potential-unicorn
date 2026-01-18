import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsUUID, IsBoolean, IsDateString, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Category, Language } from '@potential-unicorn/types';

export class QueryArticleDto {
  @ApiProperty({ enum: ['politics', 'sports', 'entertainment', 'business', 'technology', 'health', 'education', 'international', 'opinion', 'general'], required: false })
  @IsOptional()
  @IsEnum([
    'politics',
    'sports',
    'entertainment',
    'business',
    'technology',
    'health',
    'education',
    'international',
    'opinion',
    'general',
  ])
  category?: Category;

  @ApiProperty({ enum: ['ne', 'en'], required: false })
  @IsOptional()
  @IsEnum(['ne', 'en'])
  language?: Language;

  @ApiProperty({ description: 'Source ID', required: false })
  @IsOptional()
  @IsUUID()
  sourceId?: string;

  @ApiProperty({ description: 'Is trending', required: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isTrending?: boolean;

  @ApiProperty({ description: 'Date from', required: false })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiProperty({ description: 'Date to', required: false })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiProperty({ description: 'Search query', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Page number', required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: 'Items per page', required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({ enum: ['publishedAt', 'viewCount', 'createdAt'], required: false, default: 'publishedAt' })
  @IsOptional()
  @IsEnum(['publishedAt', 'viewCount', 'createdAt'])
  sortBy?: 'publishedAt' | 'viewCount' | 'createdAt' = 'publishedAt';

  @ApiProperty({ enum: ['asc', 'desc'], required: false, default: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiProperty({ description: 'Include integration test articles', required: false, default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeTests?: boolean = false;
}
