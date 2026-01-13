import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsUrl,
  IsOptional,
  IsEnum,
  IsArray,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { Category } from '@potential-unicorn/types';

export class UpdateArticleDto {
  @ApiProperty({ description: 'Article title', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Article title in English', required: false })
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiProperty({ description: 'Article content', required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ description: 'Article summary', required: false })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiProperty({ description: 'Article summary in English', required: false })
  @IsOptional()
  @IsString()
  summaryEn?: string;

  @ApiProperty({ description: 'Article highlights', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  highlights?: string[];

  @ApiProperty({ description: 'Article image URL', required: false })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiProperty({ description: 'Article author', required: false })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiProperty({ description: 'Publication date', required: false })
  @IsOptional()
  @IsDateString()
  publishedAt?: Date;

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

  @ApiProperty({ description: 'Article tags', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ description: 'Is trending', required: false })
  @IsOptional()
  @IsBoolean()
  isTrending?: boolean;
}
