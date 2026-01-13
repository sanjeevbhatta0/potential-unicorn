import { BaseCrawler, Article } from './base.crawler';
import { crawlerConfigs } from '../config/sources.config';
import * as cheerio from 'cheerio';
import logger from '../utils/logger';

export class EKantipurCrawler extends BaseCrawler {
  constructor() {
    super(crawlerConfigs.ekantipur);
  }

  /**
   * Custom extraction for eKantipur specific features
   */
  protected extractArticleData($: cheerio.CheerioAPI, url: string): Article | null {
    try {
      // Try multiple selectors for title
      let title = $('h1.article-title').first().text().trim();
      if (!title) {
        title = $('h1.title').first().text().trim();
      }
      if (!title) {
        title = $('h1').first().text().trim();
      }
      if (!title) {
        title = $('meta[property="og:title"]').attr('content')?.trim();
      }

      if (!title) {
        logger.warn(`No title found for ${url}`);
        return null;
      }

      // Extract content - eKantipur specific
      const contentParagraphs: string[] = [];

      // Try the main content selectors
      $('.article-content p').each((_, el) => {
        const text = $(el).text().trim();
        if (text && !$(el).hasClass('advertisement') && !$(el).hasClass('ad')) {
          contentParagraphs.push(text);
        }
      });

      // Fallback to other selectors
      if (contentParagraphs.length === 0) {
        $('.description p, .current-news-block p').each((_, el) => {
          const text = $(el).text().trim();
          if (text) contentParagraphs.push(text);
        });
      }

      // Another fallback - look for any content div with paragraphs
      if (contentParagraphs.length === 0) {
        $('div[itemprop="articleBody"] p').each((_, el) => {
          const text = $(el).text().trim();
          if (text) contentParagraphs.push(text);
        });
      }

      const content = contentParagraphs.join('\n\n');

      if (!content) {
        logger.warn(`No content found for ${url}`);
        return null;
      }

      // Extract author
      let author = $('.author-name').first().text().trim();
      if (!author) {
        author = $('.article-author').first().text().trim();
      }
      if (!author) {
        author = $('span[itemprop="author"] span[itemprop="name"]').first().text().trim();
      }
      if (!author) {
        author = $('meta[name="author"]').attr('content')?.trim();
      }

      // Extract publish date
      let publishDate = $('time.date').first().attr('datetime');
      if (!publishDate) {
        publishDate = $('.article-date').first().attr('datetime') || $('.article-date').first().text().trim();
      }
      if (!publishDate) {
        publishDate = $('.date').first().text().trim();
      }
      if (!publishDate) {
        publishDate = $('meta[property="article:published_time"]').attr('content');
      }

      // Extract category
      let category = $('.category').first().text().trim();
      if (!category) {
        category = $('.article-category').first().text().trim();
      }
      if (!category) {
        category = $('.breadcrumb li').last().text().trim();
      }

      // Extract featured image
      let image = $('.featured-image img').first().attr('src');
      if (!image) {
        image = $('.article-image img').first().attr('src');
      }
      if (!image) {
        image = $('meta[property="og:image"]').attr('content');
      }

      // Extract tags
      const tags: string[] = [];
      $('.tags a, .article-tags a').each((_, el) => {
        const tag = $(el).text().trim();
        if (tag) tags.push(tag);
      });

      // Also check for keywords meta tag
      const keywords = $('meta[name="keywords"]').attr('content');
      if (keywords && tags.length === 0) {
        keywords.split(',').forEach(tag => {
          const trimmed = tag.trim();
          if (trimmed) tags.push(trimmed);
        });
      }

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
   * Custom article link extraction for eKantipur
   */
  protected extractArticleLinks($: cheerio.CheerioAPI): string[] {
    const links: string[] = [];

    // Try multiple selectors for article containers
    const articleSelectors = [
      '.normal-news',
      'article.card',
      '.news-item',
      'article'
    ];

    for (const selector of articleSelectors) {
      $(selector).each((_, element) => {
        // Try multiple link selectors
        let href = $(element).find('.article-title a').first().attr('href');

        if (!href) {
          href = $(element).find('h2 a, h3 a').first().attr('href');
        }

        if (!href) {
          href = $(element).find('a').first().attr('href');
        }

        if (href) {
          // Filter out non-article URLs (ads, categories, etc.)
          const excludePatterns = [
            '/category/',
            '/tag/',
            '/author/',
            'javascript:',
            '#',
            '/advertise',
            '/contact'
          ];

          const shouldExclude = excludePatterns.some(pattern => href!.includes(pattern));

          if (!shouldExclude && (href.includes('/news/') || href.includes('/story/') || /\/\d{4}\/\d{2}\//.test(href))) {
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
