// Common types used across the application

export type Language = 'ne' | 'en';

export type Category =
  | 'politics'
  | 'sports'
  | 'entertainment'
  | 'business'
  | 'technology'
  | 'health'
  | 'education'
  | 'international'
  | 'opinion'
  | 'general';

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  timestamp: string;
}

export interface SearchParams {
  query: string;
  category?: Category;
  language?: Language;
  sourceId?: string;
  dateFrom?: Date | string;
  dateTo?: Date | string;
}
