import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsUrl,
  IsOptional,
  IsIn,
  IsArray,
  IsDateString,
} from 'class-validator';
import { Category, Language } from '@potential-unicorn/types';

const CATEGORIES = [
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
] as const;

const LANGUAGES = ['ne', 'en'] as const;

export class CreateArticleDto {
  @ApiProperty({ description: 'Source ID' })
  @IsUUID('all')
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
  publishedAt: string;

  @ApiProperty({ enum: CATEGORIES })
  @IsIn(CATEGORIES)
  category: Category;

  @ApiProperty({ description: 'Article tags', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ enum: LANGUAGES })
  @IsIn(LANGUAGES)
  language: Language;

  // AI-generated fields (optional - populated at crawl-time for new articles)
  @ApiProperty({ description: 'AI-generated summary in Nepali', required: false })
  @IsOptional()
  @IsString()
  aiSummary?: string;

  @ApiProperty({ description: 'AI-generated key points', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  aiKeyPoints?: string[];

  @ApiProperty({ description: 'AI credibility score 1-10', required: false })
  @IsOptional()
  credibilityScore?: number;
}
