// Application constants

export const APP_NAME = 'Nepali News Hub';
export const APP_DESCRIPTION = 'AI-powered news aggregator for Nepali news';

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Cache durations (in seconds)
export const CACHE_DURATION = {
  ARTICLES: 300, // 5 minutes
  TRENDING: 600, // 10 minutes
  SOURCES: 3600, // 1 hour
  USER_PROFILE: 1800, // 30 minutes
};

// Rate limiting
export const RATE_LIMITS = {
  API: 100, // requests per minute
  SEARCH: 20, // requests per minute
  AUTH: 5, // requests per minute
};

// File upload limits
export const MAX_FILE_SIZE = {
  IMAGE: 5 * 1024 * 1024, // 5 MB
  VIDEO: 50 * 1024 * 1024, // 50 MB
  DOCUMENT: 10 * 1024 * 1024, // 10 MB
};

// Supported file types
export const ALLOWED_FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  VIDEO: ['video/mp4', 'video/webm'],
  DOCUMENT: ['application/pdf', 'application/msword'],
};

// Categories
export const CATEGORIES = [
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

// Languages
export const LANGUAGES = {
  NE: 'ne',
  EN: 'en',
} as const;

// API error codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Crawler settings
export const CRAWLER_CONFIG = {
  DEFAULT_INTERVAL: 30, // minutes
  MAX_RETRIES: 3,
  TIMEOUT: 10000, // 10 seconds
  USER_AGENT: 'NepaliNewsBot/1.0',
};

// AI settings
export const AI_CONFIG = {
  MAX_SUMMARY_LENGTH: 500,
  MAX_HIGHLIGHTS: 5,
  DEFAULT_MODEL: 'claude-3-5-sonnet-20241022',
};
