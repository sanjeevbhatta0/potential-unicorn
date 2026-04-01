import Redis from 'ioredis';
import logger from '../utils/logger';

/**
 * Tracks the last seen article URLs per source in Redis.
 * Enables incremental crawling — stop processing once we hit articles
 * that were already seen in the previous crawl cycle.
 */
export class IncrementalTracker {
  private redis: Redis;
  private readonly keyPrefix = 'crawler:lastseen:';
  private readonly maxStoredUrls = 100; // Store last N article URLs per source

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    this.redis.on('error', (error) => {
      logger.error(`Redis (IncrementalTracker) error: ${error.message}`);
    });
  }

  private getKey(sourceId: string): string {
    return `${this.keyPrefix}${sourceId}`;
  }

  /**
   * Check if a URL was already seen in a previous crawl for this source.
   */
  async wasSeen(sourceId: string, url: string): Promise<boolean> {
    try {
      const score = await this.redis.zscore(this.getKey(sourceId), url);
      return score !== null;
    } catch (error: any) {
      logger.debug(`IncrementalTracker.wasSeen error: ${error.message}`);
      return false;
    }
  }

  /**
   * Mark a batch of article URLs as seen for a source.
   * Uses a sorted set with timestamp scores so we can trim old entries.
   */
  async markSeen(sourceId: string, urls: string[]): Promise<void> {
    if (urls.length === 0) return;

    try {
      const key = this.getKey(sourceId);
      const now = Date.now();

      // Add all URLs with current timestamp as score
      const members: (string | number)[] = [];
      for (const url of urls) {
        members.push(now, url);
      }
      await this.redis.zadd(key, ...members);

      // Trim to keep only the last N entries (remove oldest)
      const count = await this.redis.zcard(key);
      if (count > this.maxStoredUrls) {
        await this.redis.zremrangebyrank(key, 0, count - this.maxStoredUrls - 1);
      }

      // Set TTL of 7 days on the key
      await this.redis.expire(key, 7 * 24 * 60 * 60);

      logger.debug(`Marked ${urls.length} URLs as seen for source ${sourceId}`);
    } catch (error: any) {
      logger.warn(`IncrementalTracker.markSeen error: ${error.message}`);
    }
  }

  /**
   * Filter a list of article URLs, returning only the new (unseen) ones.
   * Stops early once it hits a streak of `earlyStopThreshold` consecutive seen URLs,
   * since listing pages are typically in reverse-chronological order.
   */
  async filterNewUrls(
    sourceId: string,
    urls: string[],
    earlyStopThreshold: number = 3
  ): Promise<string[]> {
    const newUrls: string[] = [];
    let consecutiveSeen = 0;

    for (const url of urls) {
      const seen = await this.wasSeen(sourceId, url);

      if (seen) {
        consecutiveSeen++;
        if (consecutiveSeen >= earlyStopThreshold) {
          logger.info(
            `Incremental stop: hit ${earlyStopThreshold} consecutive seen articles for source ${sourceId}. ` +
            `Returning ${newUrls.length} new URLs.`
          );
          break;
        }
      } else {
        consecutiveSeen = 0;
        newUrls.push(url);
      }
    }

    return newUrls;
  }

  async close(): Promise<void> {
    await this.redis.quit();
  }
}

export default new IncrementalTracker();
