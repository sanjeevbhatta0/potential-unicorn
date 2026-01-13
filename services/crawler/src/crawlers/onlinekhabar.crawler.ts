import { BaseCrawler, Article } from './base.crawler';
import { crawlerConfigs } from '../config/sources.config';
import * as cheerio from 'cheerio';
import logger from '../utils/logger';

export class OnlineKhabarCrawler extends BaseCrawler {
  constructor() {
    super(crawlerConfigs.onlinekhabar);
  }

  /**
   * Custom extraction for Online Khabar specific features
   */
  protected extractArticleData($: cheerio.CheerioAPI, url: string): Article | null {
    try {
      // Try multiple selectors for title
      let title = $('h1.ok18-single-post-title').first().text().trim();
      if (!title) {
        title = $('h1.ok-news-title').first().text().trim();
      }
      if (!title) {
        title = $('h1').first().text().trim();
      }

      if (!title) {
        logger.warn(`No title found for ${url}`);
        return null;
      }

      // Extract content - Online Khabar specific
      const contentParagraphs: string[] = [];

      // Try the main content selectors
      $('.ok18-single-post-content p').each((_, el) => {
        const text = $(el).text().trim();
        if (text && !$(el).hasClass('advertisement')) {
          contentParagraphs.push(text);
        }
      });

      // Fallback to other selectors
      if (contentParagraphs.length === 0) {
        $('.ok-news-post-content p').each((_, el) => {
          const text = $(el).text().trim();
          if (text) contentParagraphs.push(text);
        });
      }

      const content = contentParagraphs.join('\n\n');

      if (!content) {
        logger.warn(`No content found for ${url}`);
        return null;
      }

      // Extract author - Online Khabar may have multiple formats
      let author = $('.ok-author-name a').first().text().trim();
      if (!author) {
        author = $('.ok-news-author-name').first().text().trim();
      }
      if (!author) {
        author = $('span[itemprop="author"]').first().text().trim();
      }

      // Extract publish date
      let publishDate = $('time.ok-news-post-date').first().attr('datetime');
      if (!publishDate) {
        publishDate = $('.ok-news-date').first().text().trim();
      }
      if (!publishDate) {
        publishDate = $('time').first().attr('datetime') || $('time').first().text().trim();
      }

      // Extract category
      let category = $('.ok-cat-name').first().text().trim();
      if (!category) {
        category = $('.ok-news-category').first().text().trim();
      }

      // Extract featured image
      let image = $('.ok18-featured-image img').first().attr('src');
      if (!image) {
        image = $('.ok-news-post-featured-image').first().attr('src');
      }
      if (!image) {
        image = $('meta[property="og:image"]').attr('content');
      }

      // Extract tags
      const tags: string[] = [];
      $('.ok-tags a, .ok-news-tags a').each((_, el) => {
        const tag = $(el).text().trim();
        if (tag) tags.push(tag);
      });

      // Get absolute image URL
      const absoluteImage = image ? (image.startsWith('http') ? image : new URL(image, this.config.baseUrl).href) : undefined;

      return {
        url,
        title,
        content,
        author: author || undefined,
        publishDate: publishDate || undefined,
        category: category || undefined,
        image: absoluteImage,
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
   * Custom article link extraction for Online Khabar
   */
  protected extractArticleLinks($: cheerio.CheerioAPI): string[] {
    const links: string[] = [];

    // Try multiple selectors for article containers
    const articleSelectors = [
      'article.ok-post',
      '.ok-news-post',
      '.ok18-post',
      'article'
    ];

    for (const selector of articleSelectors) {
      $(selector).each((_, element) => {
        // Try multiple link selectors
        let href = $(element).find('a.ok-post-title-link').first().attr('href');

        if (!href) {
          href = $(element).find('h2.ok-news-title a').first().attr('href');
        }

        if (!href) {
          href = $(element).find('h2 a').first().attr('href');
        }

        if (!href) {
          href = $(element).find('a').first().attr('href');
        }

        if (href) {
          // Filter out non-article URLs
          if (href.includes('/news/') || href.includes('/article/') || /\/\d+\//.test(href)) {
            // Make absolute URL if relative
            if (!href.startsWith('http')) {
              href = new URL(href, this.config.baseUrl).href;
            }
            links.push(href);
          }
        }
      });

      if (links.length > 0) break; // If we found links, no need to try other selectors
    }

    return [...new Set(links)]; // Remove duplicates
  }
}
