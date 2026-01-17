import { BaseCrawler, Article } from './base.crawler';
import { crawlerConfigs } from '../config/sources.config';
import * as cheerio from 'cheerio';
import logger from '../utils/logger';

export class SetopatiCrawler extends BaseCrawler {
  constructor() {
    super(crawlerConfigs.setopati);
  }

  /**
   * Custom extraction for Setopati specific features
   */
  protected extractArticleData($: ReturnType<typeof cheerio.load>, url: string): Article | null {
    try {
      // Try multiple selectors for title
      let title = $('h1.news-big-title').first().text().trim();
      if (!title) {
        title = $('h1.entry-title').first().text().trim();
      }
      if (!title) {
        title = $('h1').first().text().trim();
      }
      if (!title) {
        title = $('.main-title').first().text().trim();
      }
      if (!title) {
        title = $('meta[property="og:title"]').attr('content')?.trim() ?? '';
      }

      if (!title) {
        logger.warn(`No title found for ${url}`);
        return null;
      }

      // Extract content - Setopati specific
      const contentParagraphs: string[] = [];

      // Setopati content is usually in .editor-box
      $('.editor-box p').each((_, el) => {
        const text = $(el).text().trim();
        if (text) contentParagraphs.push(text);
      });

      // Try the main content selectors
      if (contentParagraphs.length === 0) {
        $('.news-content p, #newsContent p').each((_, el) => {
          const text = $(el).text().trim();
          // Filter out ads and empty paragraphs
          if (text && !$(el).hasClass('advertisement') && !$(el).hasClass('ad') && text.length > 20) {
            contentParagraphs.push(text);
          }
        });
      }

      // Fallback to other selectors
      if (contentParagraphs.length === 0) {
        $('.description p, .story-content p').each((_, el) => {
          const text = $(el).text().trim();
          if (text && text.length > 20) contentParagraphs.push(text);
        });
      }

      // Another fallback - look for any article body
      if (contentParagraphs.length === 0) {
        $('article p, .article-body p').each((_, el) => {
          const text = $(el).text().trim();
          if (text && text.length > 20) contentParagraphs.push(text);
        });
      }

      const content = contentParagraphs.join('\n\n');

      if (!content) {
        logger.warn(`No content found for ${url}`);
        return null;
      }

      // Extract author - Setopati may show reporter name
      let author = $('.reporter-name').first().text().trim();
      if (!author) {
        author = $('.author').first().text().trim();
      }
      if (!author) {
        author = $('.news-author').first().text().trim();
      }
      if (!author) {
        author = $('span[itemprop="author"]').first().text().trim();
      }
      if (!author) {
        author = $('meta[name="author"]').attr('content')?.trim() ?? '';
      }

      // Clean up author name (remove "Reporter:" or similar prefixes)
      if (author) {
        author = author.replace(/^(Reporter|प्रतिनिधि|संवाददाता):\s*/i, '').trim();
      }

      // Extract publish date
      let publishDate = $('time').first().attr('datetime');
      if (!publishDate) {
        publishDate = $('.date, .news-date').first().text().trim();
      }
      if (!publishDate) {
        publishDate = $('meta[property="article:published_time"]').attr('content');
      }

      // Extract category
      let category = $('.category').first().text().trim();
      if (!category) {
        category = $('.news-category').first().text().trim();
      }
      if (!category) {
        category = $('.breadcrumb li').last().text().trim();
      }

      // Extract featured image
      let image = $('.featured-image img').first().attr('src');
      if (!image) {
        image = $('.news-image img').first().attr('src');
      }
      if (!image) {
        image = $('img.main-image').first().attr('src');
      }
      if (!image) {
        image = $('meta[property="og:image"]').attr('content');
      }

      // Extract tags
      const tags: string[] = [];
      $('.tags a, .news-tags a').each((_, el) => {
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
   * Custom article link extraction for Setopati
   */
  protected extractArticleLinks($: ReturnType<typeof cheerio.load>): string[] {
    const links: string[] = [];

    // Try multiple selectors for article containers
    const articleSelectors = [
      '.news-box',
      'article.news-item',
      '.news-list-item',
      'article'
    ];

    for (const selector of articleSelectors) {
      $(selector).each((_, element) => {
        // Try multiple link selectors
        let href = $(element).find('.news-title a').first().attr('href');

        if (!href) {
          href = $(element).find('h2 a, h3 a').first().attr('href');
        }

        if (!href) {
          href = $(element).find('a').first().attr('href');
        }

        if (href) {
          // Filter out non-article URLs
          const excludePatterns = [
            '/category/',
            '/tag/',
            '/author/',
            'javascript:',
            '#',
            '/page/',
            '/contact',
            '/about'
          ];

          const shouldExclude = excludePatterns.some(pattern => href!.includes(pattern));

          // Setopati articles typically have numbers in URL or specific patterns
          if (!shouldExclude && (href.includes('/news/') || href.includes('/story/') || /\/\d+/.test(href))) {
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
