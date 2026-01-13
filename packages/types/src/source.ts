import { Language } from './common';

export type SourceType = 'website' | 'youtube';

export interface NewsSource {
  id: string;
  name: string;
  type: SourceType;
  baseUrl?: string;
  channelId?: string; // For YouTube sources
  logoUrl?: string;
  language: Language;
  isActive: boolean;
  crawlConfig?: CrawlConfig;
  lastCrawledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CrawlConfig {
  enabled: boolean;
  interval: number; // in minutes
  selectors?: {
    article?: string;
    title?: string;
    content?: string;
    image?: string;
    author?: string;
    date?: string;
  };
  maxArticles?: number;
  respectRobotsTxt?: boolean;
  userAgent?: string;
}

export interface CreateSourceDto {
  name: string;
  type: SourceType;
  baseUrl?: string;
  channelId?: string;
  logoUrl?: string;
  language: Language;
  isActive?: boolean;
  crawlConfig?: Partial<CrawlConfig>;
}

export interface UpdateSourceDto {
  name?: string;
  baseUrl?: string;
  channelId?: string;
  logoUrl?: string;
  language?: Language;
  isActive?: boolean;
  crawlConfig?: Partial<CrawlConfig>;
}
