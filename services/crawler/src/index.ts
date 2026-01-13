import dotenv from 'dotenv';
import cron from 'node-cron';
import logger from './utils/logger';
import { OnlineKhabarCrawler } from './crawlers/onlinekhabar.crawler';
import { EKantipurCrawler } from './crawlers/ekantipur.crawler';
import { SetopatiCrawler } from './crawlers/setopati.crawler';
import { BaseCrawler } from './crawlers/base.crawler';
import articleProcessor from './processors/article.processor';
import deduplicator from './processors/deduplicator';
import queueProducer from './queue/producer';
import { crawlerConfigs } from './config/sources.config';

// Load environment variables
dotenv.config();

class CrawlerService {
  private crawlers: BaseCrawler[] = [];
  private isRunning: boolean = false;
  private cronJob?: cron.ScheduledTask;

  constructor() {
    this.initializeCrawlers();
  }

  /**
   * Initialize all crawlers based on configuration
   */
  private initializeCrawlers(): void {
    logger.info('Initializing crawlers...');

    // Add enabled crawlers
    if (crawlerConfigs.onlinekhabar.enabled) {
      this.crawlers.push(new OnlineKhabarCrawler());
      logger.info('Initialized Online Khabar crawler');
    }

    if (crawlerConfigs.ekantipur.enabled) {
      this.crawlers.push(new EKantipurCrawler());
      logger.info('Initialized eKantipur crawler');
    }

    if (crawlerConfigs.setopati.enabled) {
      this.crawlers.push(new SetopatiCrawler());
      logger.info('Initialized Setopati crawler');
    }

    logger.info(`Total ${this.crawlers.length} crawlers initialized`);
  }

  /**
   * Run crawl operation for all enabled crawlers
   */
  async runCrawl(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Crawl already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    logger.info('========================================');
    logger.info('Starting crawl operation...');
    logger.info('========================================');

    try {
      let totalArticles = 0;
      let totalProcessed = 0;
      let totalUnique = 0;
      let totalQueued = 0;

      // Run crawlers sequentially to avoid overwhelming the sources
      for (const crawler of this.crawlers) {
        try {
          logger.info(`\n--- Crawling ${crawler['config'].name} ---`);

          // Crawl articles
          const articles = await crawler.crawl();
          totalArticles += articles.length;

          if (articles.length === 0) {
            logger.warn(`No articles found for ${crawler['config'].name}`);
            continue;
          }

          // Process articles
          logger.info(`Processing ${articles.length} articles...`);
          const processedArticles = articleProcessor.processArticles(articles);
          totalProcessed += processedArticles.length;

          if (processedArticles.length === 0) {
            logger.warn(`No valid articles after processing for ${crawler['config'].name}`);
            continue;
          }

          // Filter duplicates
          logger.info(`Checking for duplicates...`);
          const uniqueArticles = await deduplicator.filterDuplicates(processedArticles);
          totalUnique += uniqueArticles.length;

          if (uniqueArticles.length === 0) {
            logger.info(`All articles were duplicates for ${crawler['config'].name}`);
            continue;
          }

          // Add to queue
          logger.info(`Adding ${uniqueArticles.length} unique articles to queue...`);
          const jobs = await queueProducer.addArticles(uniqueArticles);
          totalQueued += jobs.length;

          // Cleanup crawler resources
          await crawler.cleanup();

          logger.info(`✓ ${crawler['config'].name} completed: ${articles.length} crawled, ${uniqueArticles.length} unique, ${jobs.length} queued`);
        } catch (error: any) {
          logger.error(`Error crawling ${crawler['config'].name}: ${error.message}`, {
            stack: error.stack,
          });
        }
      }

      // Log summary
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      logger.info('\n========================================');
      logger.info('Crawl operation completed');
      logger.info('========================================');
      logger.info('Summary:', {
        duration: `${duration}s`,
        totalArticles,
        totalProcessed,
        totalUnique,
        totalQueued,
        duplicates: totalProcessed - totalUnique,
      });

      // Log queue statistics
      await queueProducer.logStats();

      // Clean old jobs from queue
      await queueProducer.cleanQueue();
    } catch (error: any) {
      logger.error('Crawl operation failed:', {
        error: error.message,
        stack: error.stack,
      });
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Start the cron scheduler
   */
  startScheduler(): void {
    const cronExpression = process.env.CRAWL_INTERVAL || '*/30 * * * *'; // Default: every 30 minutes

    logger.info(`Setting up cron scheduler with expression: ${cronExpression}`);

    if (!cron.validate(cronExpression)) {
      logger.error(`Invalid cron expression: ${cronExpression}`);
      return;
    }

    this.cronJob = cron.schedule(cronExpression, async () => {
      logger.info('Cron job triggered');
      await this.runCrawl();
    });

    logger.info('Cron scheduler started successfully');
    logger.info(`Next crawl will run at: ${this.cronJob.nextDate()?.toString()}`);
  }

  /**
   * Stop the cron scheduler
   */
  stopScheduler(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      logger.info('Cron scheduler stopped');
    }
  }

  /**
   * Run a single crawl immediately (useful for testing)
   */
  async runOnce(): Promise<void> {
    logger.info('Running single crawl operation...');
    await this.runCrawl();
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down crawler service...');

    this.stopScheduler();

    // Wait for current crawl to finish
    if (this.isRunning) {
      logger.info('Waiting for current crawl to finish...');
      while (this.isRunning) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Cleanup resources
    for (const crawler of this.crawlers) {
      await crawler.cleanup();
    }

    // Close queue connection
    await queueProducer.close();

    // Close deduplicator connection
    await deduplicator.close();

    logger.info('Crawler service shut down successfully');
  }
}

// Main execution
async function main() {
  const service = new CrawlerService();

  // Handle graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM signal received');
    await service.shutdown();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT signal received');
    await service.shutdown();
    process.exit(0);
  });

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection:', {
      reason,
      promise,
    });
  });

  // Check command line arguments
  const args = process.argv.slice(2);

  if (args.includes('--once') || args.includes('-o')) {
    // Run once and exit
    logger.info('Running in single-run mode');
    await service.runOnce();
    await service.shutdown();
    process.exit(0);
  } else {
    // Run with scheduler
    logger.info('Starting News Crawler Service...');
    logger.info('========================================');
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`Log Level: ${process.env.LOG_LEVEL || 'info'}`);
    logger.info(`Crawl Interval: ${process.env.CRAWL_INTERVAL || '*/30 * * * *'}`);
    logger.info('========================================');

    // Run initial crawl
    logger.info('Running initial crawl...');
    await service.runOnce();

    // Start scheduler
    service.startScheduler();

    logger.info('Service is running. Press Ctrl+C to stop.');
  }
}

// Start the service
if (require.main === module) {
  main().catch((error) => {
    logger.error('Failed to start service:', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  });
}

export default CrawlerService;
