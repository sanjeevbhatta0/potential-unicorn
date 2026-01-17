import 'dotenv/config';
import cron from 'node-cron';
import logger from './utils/logger';
import { GenericCrawler, Article } from './crawlers/generic.crawler';
import { fetchSourcesFromAPI, updateLastCrawled, SourceConfig } from './services/source-config.service';
import articleProcessor from './processors/article.processor';
import deduplicator from './processors/deduplicator';
import queueProducer from './queue/producer';

class CrawlerService {
  private isRunning: boolean = false;
  private cronJob?: cron.ScheduledTask;

  constructor() {
    logger.info('Crawler Service initialized');
  }

  /**
   * Run crawl operation for all enabled sources from the database
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
      // Fetch sources from the API
      const sources = await fetchSourcesFromAPI();

      if (sources.length === 0) {
        logger.warn('No active sources found in database');
        return;
      }

      logger.info(`Found ${sources.length} active sources to crawl`);

      let totalArticles = 0;
      let totalProcessed = 0;
      let totalUnique = 0;
      let totalQueued = 0;

      // Run crawlers sequentially to avoid overwhelming the sources
      for (const source of sources) {
        try {
          logger.info(`\n--- Crawling ${source.name} ---`);

          // Create crawler for this source
          const crawler = new GenericCrawler(source);

          // Crawl articles
          const articles = await crawler.crawl();
          totalArticles += articles.length;

          if (articles.length === 0) {
            logger.warn(`No articles found for ${source.name}`);
            continue;
          }

          // Process articles - adapt to existing processor interface
          logger.info(`Processing ${articles.length} articles...`);
          const adaptedArticles = articles.map(a => ({
            ...a,
            source: source.name,
          }));
          const processedArticles = articleProcessor.processArticles(adaptedArticles as any);
          totalProcessed += processedArticles.length;

          if (processedArticles.length === 0) {
            logger.warn(`No valid articles after processing for ${source.name}`);
            continue;
          }

          // Filter duplicates
          logger.info(`Checking for duplicates...`);
          const uniqueArticles = await deduplicator.filterDuplicates(processedArticles);
          totalUnique += uniqueArticles.length;

          if (uniqueArticles.length === 0) {
            logger.info(`All articles were duplicates for ${source.name}`);
            continue;
          }

          // Add to queue
          logger.info(`Adding ${uniqueArticles.length} unique articles to queue...`);
          const jobs = await queueProducer.addArticles(uniqueArticles);
          totalQueued += jobs.length;

          // Update last crawled timestamp
          await updateLastCrawled(source.id);

          logger.info(`✓ ${source.name} completed: ${articles.length} crawled, ${uniqueArticles.length} unique, ${jobs.length} queued`);
        } catch (error: any) {
          logger.error(`Error crawling ${source.name}: ${error.message}`, {
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
        sources: sources.length,
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
    logger.info(`Crawler will run on schedule: ${cronExpression}`);
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

    // Close queue connection
    await queueProducer.close();

    // Close deduplicator redis connection
    await deduplicator.close();

    logger.info('Crawler service shut down complete');
  }
}

// Main entry point
async function main(): Promise<void> {
  const crawlerService = new CrawlerService();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Received SIGINT signal');
    await crawlerService.shutdown();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM signal');
    await crawlerService.shutdown();
    process.exit(0);
  });

  // Start the crawler
  logger.info('Starting News Crawler Service (Dynamic Sources)...');
  logger.info('========================================');
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Log Level: ${process.env.LOG_LEVEL || 'info'}`);
  logger.info(`Crawl Interval: ${process.env.CRAWL_INTERVAL || '*/30 * * * *'}`);
  logger.info(`API URL: ${process.env.API_URL || 'http://localhost:3333'}`);
  logger.info('========================================');

  // Run initial crawl
  logger.info('Running initial crawl...');
  await crawlerService.runOnce();

  // Start scheduler
  crawlerService.startScheduler();
}

// Run the main function
main().catch(error => {
  logger.error('Fatal error:', error);
  process.exit(1);
});
