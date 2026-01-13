import crypto from 'crypto';
import Redis from 'ioredis';
import logger from '../utils/logger';
import { ProcessedArticle } from './article.processor';

export class Deduplicator {
  private redis: Redis;
  private readonly urlHashKeyPrefix = 'article:url:';
  private readonly contentHashKeyPrefix = 'article:content:';
  private readonly titleHashKeyPrefix = 'article:title:';
  private readonly ttl = 30 * 24 * 60 * 60; // 30 days in seconds

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.redis.on('error', (error) => {
      logger.error(`Redis connection error: ${error.message}`);
    });

    this.redis.on('connect', () => {
      logger.info('Connected to Redis for deduplication');
    });
  }

  /**
   * Generate MD5 hash of content
   */
  private generateHash(content: string): string {
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Normalize URL for comparison
   */
  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Remove query parameters and fragments
      return `${urlObj.origin}${urlObj.pathname}`.toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  }

  /**
   * Normalize content for comparison (remove extra whitespace, special chars)
   */
  private normalizeContent(content: string): string {
    return content
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\u0900-\u097F]/g, '')
      .trim();
  }

  /**
   * Normalize title for comparison
   */
  private normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s\u0900-\u097F]/g, '')
      .trim();
  }

  /**
   * Calculate content similarity using Jaccard similarity
   */
  private calculateJaccardSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Check if URL has been seen before
   */
  async isDuplicateUrl(url: string): Promise<boolean> {
    try {
      const normalizedUrl = this.normalizeUrl(url);
      const urlHash = this.generateHash(normalizedUrl);
      const key = `${this.urlHashKeyPrefix}${urlHash}`;

      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch (error: any) {
      logger.error(`Error checking duplicate URL: ${error.message}`);
      return false;
    }
  }

  /**
   * Check if content has been seen before (similar content)
   */
  async isDuplicateContent(content: string, threshold: number = 0.85): Promise<boolean> {
    try {
      const normalizedContent = this.normalizeContent(content);
      const contentHash = this.generateHash(normalizedContent);
      const key = `${this.contentHashKeyPrefix}${contentHash}`;

      const exists = await this.redis.exists(key);
      if (exists === 1) {
        return true;
      }

      // Check for similar content using stored hashes
      // This is a simplified approach - in production, you might want to use
      // MinHash or SimHash for better performance with large datasets
      const pattern = `${this.contentHashKeyPrefix}*`;
      const stream = this.redis.scanStream({
        match: pattern,
        count: 100,
      });

      return new Promise((resolve, reject) => {
        let foundSimilar = false;

        stream.on('data', async (keys: string[]) => {
          if (foundSimilar) return;

          for (const existingKey of keys) {
            try {
              const existingContent = await this.redis.get(existingKey);
              if (existingContent) {
                const similarity = this.calculateJaccardSimilarity(normalizedContent, existingContent);
                if (similarity >= threshold) {
                  foundSimilar = true;
                  stream.destroy();
                  resolve(true);
                  return;
                }
              }
            } catch (err) {
              // Continue checking other keys
            }
          }
        });

        stream.on('end', () => {
          if (!foundSimilar) {
            resolve(false);
          }
        });

        stream.on('error', (err) => {
          logger.error(`Error scanning Redis keys: ${err.message}`);
          resolve(false);
        });
      });
    } catch (error: any) {
      logger.error(`Error checking duplicate content: ${error.message}`);
      return false;
    }
  }

  /**
   * Check if title has been seen before (exact or very similar)
   */
  async isDuplicateTitle(title: string, threshold: number = 0.9): Promise<boolean> {
    try {
      const normalizedTitle = this.normalizeTitle(title);
      const titleHash = this.generateHash(normalizedTitle);
      const key = `${this.titleHashKeyPrefix}${titleHash}`;

      const exists = await this.redis.exists(key);
      if (exists === 1) {
        return true;
      }

      // Check for similar titles
      const pattern = `${this.titleHashKeyPrefix}*`;
      const stream = this.redis.scanStream({
        match: pattern,
        count: 100,
      });

      return new Promise((resolve, reject) => {
        let foundSimilar = false;

        stream.on('data', async (keys: string[]) => {
          if (foundSimilar) return;

          for (const existingKey of keys) {
            try {
              const existingTitle = await this.redis.get(existingKey);
              if (existingTitle) {
                const similarity = this.calculateJaccardSimilarity(normalizedTitle, existingTitle);
                if (similarity >= threshold) {
                  foundSimilar = true;
                  stream.destroy();
                  resolve(true);
                  return;
                }
              }
            } catch (err) {
              // Continue checking other keys
            }
          }
        });

        stream.on('end', () => {
          if (!foundSimilar) {
            resolve(false);
          }
        });

        stream.on('error', (err) => {
          logger.error(`Error scanning Redis keys: ${err.message}`);
          resolve(false);
        });
      });
    } catch (error: any) {
      logger.error(`Error checking duplicate title: ${error.message}`);
      return false;
    }
  }

  /**
   * Check if article is a duplicate
   */
  async isDuplicate(article: ProcessedArticle): Promise<{
    isDuplicate: boolean;
    reason?: string;
  }> {
    try {
      // Check URL first (fastest check)
      const urlDuplicate = await this.isDuplicateUrl(article.url);
      if (urlDuplicate) {
        return { isDuplicate: true, reason: 'duplicate_url' };
      }

      // Check title (medium speed check)
      const titleDuplicate = await this.isDuplicateTitle(article.title);
      if (titleDuplicate) {
        return { isDuplicate: true, reason: 'duplicate_title' };
      }

      // Check content (slowest but most thorough check)
      const contentDuplicate = await this.isDuplicateContent(article.content);
      if (contentDuplicate) {
        return { isDuplicate: true, reason: 'duplicate_content' };
      }

      return { isDuplicate: false };
    } catch (error: any) {
      logger.error(`Error checking duplicate article: ${error.message}`);
      return { isDuplicate: false };
    }
  }

  /**
   * Mark article as seen
   */
  async markAsSeen(article: ProcessedArticle): Promise<void> {
    try {
      const normalizedUrl = this.normalizeUrl(article.url);
      const normalizedContent = this.normalizeContent(article.content);
      const normalizedTitle = this.normalizeTitle(article.title);

      const urlHash = this.generateHash(normalizedUrl);
      const contentHash = this.generateHash(normalizedContent);
      const titleHash = this.generateHash(normalizedTitle);

      // Store with TTL
      await Promise.all([
        this.redis.setex(`${this.urlHashKeyPrefix}${urlHash}`, this.ttl, normalizedUrl),
        this.redis.setex(`${this.contentHashKeyPrefix}${contentHash}`, this.ttl, normalizedContent),
        this.redis.setex(`${this.titleHashKeyPrefix}${titleHash}`, this.ttl, normalizedTitle),
      ]);

      logger.debug(`Marked article as seen: ${article.title}`);
    } catch (error: any) {
      logger.error(`Error marking article as seen: ${error.message}`);
    }
  }

  /**
   * Filter out duplicate articles from a list
   */
  async filterDuplicates(articles: ProcessedArticle[]): Promise<ProcessedArticle[]> {
    logger.info(`Checking ${articles.length} articles for duplicates`);

    const uniqueArticles: ProcessedArticle[] = [];
    let duplicateCount = 0;

    for (const article of articles) {
      const { isDuplicate, reason } = await this.isDuplicate(article);

      if (!isDuplicate) {
        uniqueArticles.push(article);
        await this.markAsSeen(article);
      } else {
        duplicateCount++;
        logger.debug(`Skipping duplicate article: ${article.title} (${reason})`);
      }
    }

    logger.info(`Filtered out ${duplicateCount} duplicates, ${uniqueArticles.length} unique articles remaining`);

    return uniqueArticles;
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    await this.redis.quit();
  }
}

export default new Deduplicator();
