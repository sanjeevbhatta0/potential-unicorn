import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsUrl,
  IsOptional,
  IsEnum,
  IsArray,
  IsDateString,
} from 'class-validator';
import { Category, Language } from '@potential-unicorn/types';

export class CreateArticleDto {
  @ApiProperty({ description: 'Source ID' })
  @IsUUID()
  sourceId: string;

  @ApiProperty({ description: 'Article title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Article title in English', required: false })
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiProperty({ description: 'Article content' })
  @IsString()
  content: string;

  @ApiProperty({ description: 'Article URL' })
  @IsUrl()
  url: string;

  @ApiProperty({ description: 'Article image URL', required: false })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiProperty({ description: 'Article author', required: false })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiProperty({ description: 'Publication date' })
  @IsDateString()
  publishedAt: Date;

  @ApiProperty({ enum: ['politics', 'sports', 'entertainment', 'business', 'technology', 'health', 'education', 'international', 'opinion', 'general'] })
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
  category: Category;

  @ApiProperty({ description: 'Article tags', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ enum: ['ne', 'en'] })
  @IsEnum(['ne', 'en'])
  language: Language;
}
