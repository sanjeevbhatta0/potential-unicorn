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
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiProperty({ description: 'Crawl interval in minutes', required: false })
  @IsOptional()
  @IsNumber()
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
  @IsOptional()
  @IsNumber()
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

export class UpdateSourceDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

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

  @ApiProperty({ enum: ['ne', 'en'], required: false })
  @IsOptional()
  @IsEnum(['ne', 'en'])
  language?: Language;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false, type: CrawlConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CrawlConfigDto)
  crawlConfig?: Partial<CrawlConfigDto>;
}
