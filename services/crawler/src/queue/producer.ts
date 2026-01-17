import Queue, { Queue as QueueType, Job, JobOptions } from 'bull';
import logger from '../utils/logger';
import { ProcessedArticle } from '../processors/article.processor';
import axios from 'axios';

export interface ArticleJobData {
  article: ProcessedArticle;
  timestamp: Date;
  source: string;
}

export class QueueProducer {
  private queue: QueueType<ArticleJobData>;
  private readonly queueName: string;

  constructor() {
    this.queueName = process.env.QUEUE_NAME || 'news-articles';

    // Initialize Bull queue
    this.queue = new Queue(this.queueName, {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
      },
      defaultJobOptions: {
        attempts: parseInt(process.env.QUEUE_MAX_RETRIES || '3'),
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 500, // Keep last 500 failed jobs
      },
    });

    this.setupEventHandlers();
    this.setupProcessor();
  }

  /**
   * Setup event handlers for queue monitoring
   */
  private setupEventHandlers(): void {
    this.queue.on('ready', () => {
      logger.info(`Queue "${this.queueName}" is ready`);
    });

    this.queue.on('error', (error) => {
      logger.error(`Queue error: ${error.message}`);
    });

    this.queue.on('failed', (job, error) => {
      logger.error(`Job ${job.id} failed: ${error.message}`, {
        jobId: job.id,
        article: job.data.article.title,
      });
    });

    this.queue.on('completed', (job) => {
      logger.info(`Job ${job.id} completed successfully`, {
        jobId: job.id,
        article: job.data.article.title,
      });
    });

    this.queue.on('stalled', (job) => {
      logger.warn(`Job ${job.id} stalled`, {
        jobId: job.id,
        article: job.data.article.title,
      });
    });
  }

  /**
   * Setup job processor
   */
  private setupProcessor(): void {
    // Process jobs - send articles to API or storage
    this.queue.process(async (job: Job<ArticleJobData>) => {
      const { article } = job.data;

      logger.info(`Processing article: ${article.title}`);

      try {
        // If API endpoint is configured, send the article
        const apiEndpoint = process.env.API_ENDPOINT;
        if (apiEndpoint) {
          await this.sendToApi(article, apiEndpoint);
        } else {
          // Just log if no API endpoint configured
          logger.info(`Article processed: ${article.title}`, {
            url: article.url,
            source: article.source,
            wordCount: article.wordCount,
          });
        }

        return { success: true, article: article.title };
      } catch (error: any) {
        logger.error(`Error processing article: ${error.message}`);
        throw error; // Let Bull handle retry
      }
    });
  }

  /**
   * Send article to API endpoint
   */
  private async sendToApi(article: ProcessedArticle, endpoint: string): Promise<void> {
    try {
      const apiKey = process.env.API_KEY;
      const headers: any = {
        'Content-Type': 'application/json',
      };

      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      // Map source name to sourceId
      const sourceIds: Record<string, string> = {
        'Online Khabar': '550e8400-e29b-41d4-a716-446655440001',
        'eKantipur': '550e8400-e29b-41d4-a716-446655440002',
        'Setopati': '550e8400-e29b-41d4-a716-446655440003',
      };

      // Map category to valid enum value
      const categoryMap: Record<string, string> = {
        'politics': 'politics',
        'राजनीति': 'politics',
        'समाचार': 'general',
        'sports': 'sports',
        'खेलकुद': 'sports',
        'entertainment': 'entertainment',
        'मनोरञ्जन': 'entertainment',
        'business': 'business',
        'अर्थ/वाणिज्य': 'business',
        'technology': 'technology',
        'प्रविधि': 'technology',
        'health': 'health',
        'स्वास्थ्य': 'health',
        'education': 'education',
        'शिक्षा': 'education',
        'international': 'international',
        'अन्तर्राष्ट्रिय': 'international',
        'opinion': 'opinion',
        'विचार': 'opinion',
      };

      const mappedCategory = categoryMap[article.category?.toLowerCase() || ''] || 'general';
      const mappedLanguage = article.language === 'mixed' ? 'ne' : article.language;

      // Transform to API format
      const apiPayload = {
        sourceId: sourceIds[article.source] || sourceIds['Online Khabar'],
        title: article.title,
        content: article.content,
        url: article.url,
        imageUrl: article.image,
        author: article.author,
        publishedAt: article.publishDate ? new Date(article.publishDate).toISOString() : new Date().toISOString(),
        category: mappedCategory,
        tags: article.tags,
        language: mappedLanguage,
      };

      logger.info(`DEBUG: Sending article to API`, {
        source: article.source,
        sourceId: apiPayload.sourceId,
        publishedAt: apiPayload.publishedAt,
        category: apiPayload.category,
      });

      const response = await axios.post(endpoint, apiPayload, {
        headers,
        timeout: 30000,
      });

      logger.info(`Article sent to API: ${article.title}`, {
        status: response.status,
        url: article.url,
      });
    } catch (error: any) {
      if (error.response) {
        logger.error(`API error: ${error.response.status} - ${error.response.statusText}`, {
          article: article.title,
          data: error.response.data,
        });
      } else {
        logger.error(`Failed to send article to API: ${error.message}`, {
          article: article.title,
        });
      }
      throw error;
    }
  }

  /**
   * Add a single article to the queue
   */
  async addArticle(article: ProcessedArticle, options?: JobOptions): Promise<Job<ArticleJobData>> {
    try {
      const jobData: ArticleJobData = {
        article,
        timestamp: new Date(),
        source: article.source,
      };

      const job = await this.queue.add(jobData, {
        ...options,
        priority: this.calculatePriority(article),
      });

      logger.debug(`Added article to queue: ${article.title}`, {
        jobId: job.id,
        source: article.source,
      });

      return job;
    } catch (error: any) {
      logger.error(`Failed to add article to queue: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate job priority based on article metadata
   */
  private calculatePriority(article: ProcessedArticle): number {
    // Lower number = higher priority
    let priority = 10; // Default priority

    // Prioritize recent articles
    if (article.publishDate) {
      const publishTime = new Date(article.publishDate).getTime();
      const now = Date.now();
      const hoursSincePublish = (now - publishTime) / (1000 * 60 * 60);

      if (hoursSincePublish < 1) {
        priority -= 5; // Very recent
      } else if (hoursSincePublish < 6) {
        priority -= 3; // Recent
      }
    }

    // Prioritize longer articles (more substantial content)
    if (article.wordCount > 1000) {
      priority -= 2;
    }

    return Math.max(1, priority); // Ensure priority is at least 1
  }

  /**
   * Add multiple articles to the queue
   */
  async addArticles(articles: ProcessedArticle[]): Promise<Job<ArticleJobData>[]> {
    logger.info(`Adding ${articles.length} articles to queue`);

    const jobs: Job<ArticleJobData>[] = [];

    for (const article of articles) {
      try {
        const job = await this.addArticle(article);
        jobs.push(job);
      } catch (error: any) {
        logger.error(`Failed to add article "${article.title}" to queue: ${error.message}`);
      }
    }

    logger.info(`Successfully added ${jobs.length}/${articles.length} articles to queue`);

    return jobs;
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }

  /**
   * Log queue statistics
   */
  async logStats(): Promise<void> {
    const stats = await this.getStats();
    logger.info('Queue statistics', stats);
  }

  /**
   * Clean old jobs from the queue
   */
  async cleanQueue(grace: number = 3600000): Promise<void> {
    try {
      // Clean completed jobs older than grace period (default 1 hour)
      await this.queue.clean(grace, 'completed');
      // Clean failed jobs older than grace period
      await this.queue.clean(grace, 'failed');

      logger.info('Queue cleaned successfully');
    } catch (error: any) {
      logger.error(`Failed to clean queue: ${error.message}`);
    }
  }

  /**
   * Pause the queue
   */
  async pause(): Promise<void> {
    await this.queue.pause();
    logger.info('Queue paused');
  }

  /**
   * Resume the queue
   */
  async resume(): Promise<void> {
    await this.queue.resume();
    logger.info('Queue resumed');
  }

  /**
   * Close the queue connection
   */
  async close(): Promise<void> {
    await this.queue.close();
    logger.info('Queue connection closed');
  }

  /**
   * Get the queue instance (for advanced usage)
   */
  getQueue(): QueueType<ArticleJobData> {
    return this.queue;
  }
}

export default new QueueProducer();
