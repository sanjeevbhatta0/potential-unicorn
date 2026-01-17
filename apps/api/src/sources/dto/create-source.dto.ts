import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsUrl,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Language } from '@potential-unicorn/types';

class CrawlConfigDto {
  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiProperty({ description: 'Crawl interval in minutes', required: false })
  @IsNumber()
  @IsOptional()
  interval?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  selectors?: {
    article?: string;
    title?: string;
    content?: string;
    image?: string;
    author?: string;
    date?: string;
  };

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  maxArticles?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  respectRobotsTxt?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  userAgent?: string;
}

export class CreateSourceDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: ['website', 'youtube'] })
  @IsEnum(['website', 'youtube'])
  type: 'website' | 'youtube';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  baseUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  channelId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiProperty({ enum: ['ne', 'en'] })
  @IsEnum(['ne', 'en'])
  language: Language;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false, type: CrawlConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CrawlConfigDto)
  crawlConfig?: Partial<CrawlConfigDto>;
}
