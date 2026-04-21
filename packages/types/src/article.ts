import { Category, Language } from './common';

export interface Article {
  id: string;
  sourceId: string;
  title: string;
  titleEn?: string;
  titleNe?: string;
  content: string;
  summary: string;
  summaryEn?: string;
  highlights: string[];
  url: string;
  imageUrl?: string;
  author?: string;
  publishedAt: Date;
  category: Category;
  tags: string[];
  language: Language;
  viewCount: number;
  isTrending: boolean;
  embedding?: number[]; // Vector embedding for semantic search
  // AI-generated fields
  aiSummary?: string;
  aiSummaryEn?: string;
  aiSummaryNe?: string;
  aiKeyPoints?: string[];
  aiKeyPointsEn?: string[];
  aiKeyPointsNe?: string[];
  credibilityScore?: number;
  newsRank?: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateArticleDto {
  sourceId: string;
  title: string;
  titleEn?: string;
  content: string;
  url: string;
  imageUrl?: string;
  author?: string;
  publishedAt: Date;
  category: Category;
  tags?: string[];
  language: Language;
}

export interface UpdateArticleDto {
  title?: string;
  titleEn?: string;
  content?: string;
  summary?: string;
  summaryEn?: string;
  highlights?: string[];
  imageUrl?: string;
  author?: string;
  publishedAt?: Date;
  category?: Category;
  tags?: string[];
  isTrending?: boolean;
}

export interface ArticleQueryParams {
  category?: Category;
  language?: Language;
  sourceId?: string;
  isTrending?: boolean;
  dateFrom?: Date | string;
  dateTo?: Date | string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'publishedAt' | 'viewCount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ArticleSummary {
  summary: string;
  summaryEn?: string;
  highlights: string[];
  keyEntities?: {
    people: string[];
    places: string[];
    organizations: string[];
    dates: string[];
  };
}
