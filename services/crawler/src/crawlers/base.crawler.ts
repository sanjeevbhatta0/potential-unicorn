import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import { chromium, Browser, Page } from 'playwright';
import logger from '../utils/logger';
import { CrawlerConfig } from '../config/sources.config';

export interface Article {
  url: string;
  title: string;
  content: string;
  author?: string;
  publishDate?: string;
  category?: string;
  image?: string;
  tags?: string[];
  source: string;
  sourceId?: string;
  crawledAt: Date;
}

export abstract class BaseCrawler {
  protected config: CrawlerConfig;
  protected axiosInstance: AxiosInstance;
  protected browser?: Browser;
  protected lastRequestTime: number = 0;

  constructor(config: CrawlerConfig) {
    this.config = config;
    this.axiosInstance = axios.create({
      timeout: parseInt(process.env.REQUEST_TIMEOUT || '30000'),
      headers: {
        'User-Agent': process.env.USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,ne;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
      },
    });
  }

  /**
   * Rate limiting: Wait before making the next request
   */
  protected async respectRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const delayNeeded = this.config.rateLimit.delayBetweenRequests - timeSinceLastRequest;

    if (delayNeeded > 0) {
      logger.debug(`Rate limiting: Waiting ${delayNeeded}ms before next request`);
      await this.sleep(delayNeeded);
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Sleep utility
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Fetch HTML content using axios
   */
  protected async fetchWithAxios(url: string): Promise<string> {
    await this.respectRateLimit();

    const maxRetries = parseInt(process.env.RETRY_ATTEMPTS || '3');
    const retryDelay = parseInt(process.env.RETRY_DELAY || '5000');

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.debug(`Fetching ${url} (attempt ${attempt}/${maxRetries})`);
        const response = await this.axiosInstance.get(url);
        return response.data;
      } catch (error: any) {
        logger.warn(`Failed to fetch ${url} (attempt ${attempt}/${maxRetries}): ${error.message}`);

        if (attempt < maxRetries) {
          await this.sleep(retryDelay * attempt);
        } else {
          throw new Error(`Failed to fetch ${url} after ${maxRetries} attempts: ${error.message}`);
        }
      }
    }

    throw new Error(`Failed to fetch ${url}`);
  }

  /**
   * Fetch HTML content using Playwright (for dynamic content)
   */
  protected async fetchWithPlaywright(url: string): Promise<string> {
    await this.respectRateLimit();

    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: process.env.HEADLESS !== 'false',
      });
    }

    const page: Page = await this.browser.newPage();

    try {
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: parseInt(process.env.BROWSER_TIMEOUT || '60000'),
      });

      // Wait a bit for any lazy-loaded content
      await this.sleep(2000);

      const html = await page.content();
      await page.close();

      return html;
    } catch (error: any) {
      await page.close();
      throw new Error(`Failed to fetch ${url} with Playwright: ${error.message}`);
    }
  }

  /**
   * Fetch HTML content (chooses between axios and playwright)
   */
  protected async fetchHtml(url: string): Promise<string> {
    if (this.config.usePlaywright) {
      return this.fetchWithPlaywright(url);
    } else {
      return this.fetchWithAxios(url);
    }
  }

  /**
   * Extract article links from listing page
   */
  protected extractArticleLinks($: ReturnType<typeof cheerio.load>): string[] {
    const links: string[] = [];
    const { articleList, articleLink } = this.config.selectors;

    $(articleList).each((_, element) => {
      const linkElement = $(element).find(articleLink);
      let href = linkElement.attr('href');

      if (href) {
        // Make absolute URL if relative
        if (!href.startsWith('http')) {
          href = new URL(href, this.config.baseUrl).href;
        }
        links.push(href);
      }
    });

    return [...new Set(links)]; // Remove duplicates
  }

  /**
   * Extract article data from article page
   */
  protected extractArticleData($: ReturnType<typeof cheerio.load>, url: string): Article | null {
    try {
      const selectors = this.config.selectors;

      // Extract title
      const title = $(selectors.title).first().text().trim();
      if (!title) {
        logger.warn(`No title found for ${url}`);
        return null;
      }

      // Extract content (join all paragraphs)
      const contentParagraphs: string[] = [];
      $(selectors.content).each((_, el) => {
        const text = $(el).text().trim();
        if (text) contentParagraphs.push(text);
      });
      const content = contentParagraphs.join('\n\n');

      if (!content) {
        logger.warn(`No content found for ${url}`);
        return null;
      }

      // Extract optional fields
      const author = selectors.author ? $(selectors.author).first().text().trim() : undefined;
      const publishDate = selectors.publishDate ? $(selectors.publishDate).first().attr('datetime') || $(selectors.publishDate).first().text().trim() : undefined;
      const category = selectors.category ? $(selectors.category).first().text().trim() : undefined;
      const image = selectors.image ? $(selectors.image).first().attr('src') : undefined;

      // Extract tags
      const tags: string[] = [];
      if (selectors.tags) {
        $(selectors.tags).each((_, el) => {
          const tag = $(el).text().trim();
          if (tag) tags.push(tag);
        });
      }

      return {
        url,
        title,
        content,
        author,
        publishDate,
        category,
        image: image ? (image.startsWith('http') ? image : new URL(image, this.config.baseUrl).href) : undefined,
        tags: tags.length > 0 ? tags : undefined,
        source: this.config.name,
        crawledAt: new Date(),
      };
    } catch (error: any) {
      logger.error(`Error extracting article data from ${url}: ${error.message}`);
      return null;
    }
  }

  /**
   * Crawl a single article
   */
  async crawlArticle(url: string): Promise<Article | null> {
    try {
      logger.info(`Crawling article: ${url}`);
      const html = await this.fetchHtml(url);
      const $ = cheerio.load(html);
      return this.extractArticleData($, url);
    } catch (error: any) {
      logger.error(`Failed to crawl article ${url}: ${error.message}`);
      return null;
    }
  }

  /**
   * Get article links from listing pages
   */
  async getArticleLinks(maxPages: number = 1): Promise<string[]> {
    const allLinks: string[] = [];

    try {
      for (let page = 1; page <= maxPages; page++) {
        const pageUrl = this.getPageUrl(page);
        logger.info(`Fetching article links from: ${pageUrl}`);

        const html = await this.fetchHtml(pageUrl);
        const $ = cheerio.load(html);
        const links = this.extractArticleLinks($);

        logger.info(`Found ${links.length} article links on page ${page}`);
        allLinks.push(...links);

        // Check if we should continue pagination
        if (this.config.pagination?.enabled && page < maxPages) {
          // Check if next page exists
          if (this.config.pagination.nextPageSelector) {
            const hasNextPage = $(this.config.pagination.nextPageSelector).length > 0;
            if (!hasNextPage) {
              logger.info('No more pages found');
              break;
            }
          }
        }
      }
    } catch (error: any) {
      logger.error(`Failed to get article links: ${error.message}`);
    }

    return [...new Set(allLinks)]; // Remove duplicates
  }

  /**
   * Get URL for specific page number
   */
  protected getPageUrl(page: number): string {
    if (page === 1) {
      return this.config.baseUrl;
    }

    if (this.config.pagination?.pageUrlPattern) {
      return this.config.pagination.pageUrlPattern.replace('{page}', page.toString());
    }

    return this.config.baseUrl;
  }

  /**
   * Crawl multiple articles
   */
  async crawl(): Promise<Article[]> {
    logger.info(`Starting crawl for ${this.config.name}`);

    const maxPages = this.config.pagination?.maxPages || 1;
    const articleLinks = await this.getArticleLinks(maxPages);

    logger.info(`Found ${articleLinks.length} total articles to crawl`);

    const articles: Article[] = [];

    for (const link of articleLinks) {
      const article = await this.crawlArticle(link);
      if (article) {
        articles.push(article);
      }
    }

    logger.info(`Successfully crawled ${articles.length} articles from ${this.config.name}`);
    return articles;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = undefined;
    }
  }
}
