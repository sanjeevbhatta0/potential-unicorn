import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { NewsSourceEntity } from '../database/entities/source.entity';
import { ArticleEntity } from '../database/entities/article.entity';
import { SourcesService } from './sources.service';

export interface CrawlResult {
  sourceId: string;
  sourceName: string;
  articlesFound: number;
  articlesCreated: number;
  skipped: number;
  duplicates: number;
  errors: string[];
}

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);

  constructor(
    @InjectRepository(ArticleEntity)
    private readonly articleRepository: Repository<ArticleEntity>,
    private readonly sourcesService: SourcesService,
  ) {}

  async crawlSource(sourceId: string): Promise<CrawlResult> {
    const source = await this.sourcesService.findOne(sourceId);
    return this.crawl(source);
  }

  async crawlAll(): Promise<CrawlResult[]> {
    const sources = await this.sourcesService.getActiveSources();
    const results: CrawlResult[] = [];

    for (const source of sources) {
      if (!source.crawlConfig?.enabled) continue;
      try {
        const result = await this.crawl(source);
        results.push(result);
      } catch (error: any) {
        results.push({
          sourceId: source.id,
          sourceName: source.name,
          articlesFound: 0,
          articlesCreated: 0,
          skipped: 0,
          duplicates: 0,
          errors: [error.message],
        });
      }
    }

    return results;
  }

  private async crawl(source: NewsSourceEntity): Promise<CrawlResult> {
    const result: CrawlResult = {
      sourceId: source.id,
      sourceName: source.name,
      articlesFound: 0,
      articlesCreated: 0,
      skipped: 0,
      duplicates: 0,
      errors: [],
    };

    if (!source.baseUrl || !source.crawlConfig?.selectors) {
      result.errors.push('Missing baseUrl or crawl selectors');
      return result;
    }

    const selectors = source.crawlConfig.selectors;
    const maxArticles = source.crawlConfig.maxArticles || 10;
    const userAgent =
      source.crawlConfig.userAgent ||
      'NewsChautari.ai/1.0 (news aggregator)';

    try {
      // Fetch the source homepage/listing page
      const { data: html } = await axios.get(source.baseUrl, {
        headers: { 'User-Agent': userAgent },
        timeout: 15000,
      });

      const $ = cheerio.load(html);

      // Extract article links from the listing page
      const articleLinks: string[] = [];
      const articleSelector = selectors.article || 'a[href]';

      $(articleSelector).each((_i, el) => {
        if (articleLinks.length >= maxArticles) return false;

        let href = $(el).attr('href');
        if (!href) return;

        // Convert relative URLs to absolute
        if (href.startsWith('/')) {
          const baseOrigin = new URL(source.baseUrl).origin;
          href = `${baseOrigin}${href}`;
        } else if (!href.startsWith('http')) {
          href = `${source.baseUrl.replace(/\/$/, '')}/${href}`;
        }

        // Skip non-article links (anchors, javascript, images, assets)
        if (href.includes('#') || href.startsWith('javascript:')) return;
        if (/\.(jpg|jpeg|png|gif|svg|webp|css|js)(\?|$)/i.test(href)) return;
        if (href.includes('assets-cdn') || href.includes('thumb.php')) return;

        // Deduplicate
        if (!articleLinks.includes(href)) {
          articleLinks.push(href);
        }
      });

      result.articlesFound = articleLinks.length;
      this.logger.log(
        `Found ${articleLinks.length} article links from ${source.name}`,
      );

      // Fetch and parse each article
      for (const url of articleLinks) {
        try {
          // Check if article already exists
          const existing = await this.articleRepository.findOne({
            where: { url },
          });
          if (existing) {
            result.duplicates++;
            continue;
          }

          const article = await this.fetchArticle(url, selectors, userAgent);
          if (!article.title || !article.content) {
            result.skipped++;
            result.errors.push(`Skipped ${url}: title=${article.title?.length || 0}chars, content=${article.content?.length || 0}chars`);
            continue;
          }

          // Save article
          const entity = this.articleRepository.create({
            sourceId: source.id,
            title: article.title,
            content: article.content,
            url,
            imageUrl: article.imageUrl,
            author: article.author,
            publishedAt: article.publishedAt || new Date(),
            category: 'general',
            language: source.language,
            summary: '',
            highlights: [],
            tags: [],
            viewCount: 0,
            isTrending: false,
          });

          await this.articleRepository.save(entity);
          result.articlesCreated++;
        } catch (err: any) {
          result.errors.push(`Failed to fetch ${url}: ${err.message}`);
        }
      }

      // Update last crawled timestamp
      await this.sourcesService.updateLastCrawledAt(source.id);
    } catch (err: any) {
      result.errors.push(`Failed to fetch listing page: ${err.message}`);
    }

    this.logger.log(
      `Crawled ${source.name}: ${result.articlesCreated} new articles`,
    );
    return result;
  }

  /**
   * Clean extracted text: collapse whitespace, remove stray HTML artifacts
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')       // collapse whitespace/newlines
      .replace(/\t/g, ' ')
      .replace(/Comments\s*Shares?/gi, '')  // remove social cruft
      .replace(/\d+\s*shares?/gi, '')
      .trim();
  }

  private async fetchArticle(
    url: string,
    selectors: NonNullable<NewsSourceEntity['crawlConfig']>['selectors'],
    userAgent: string,
  ): Promise<{
    title: string;
    content: string;
    imageUrl?: string;
    author?: string;
    publishedAt?: Date;
  }> {
    const { data: html } = await axios.get(url, {
      headers: { 'User-Agent': userAgent },
      timeout: 15000,
    });

    const $ = cheerio.load(html);

    // Remove script, style, nav, footer, header, sidebar before extracting text
    $('script, style, nav, footer, header, aside, .sidebar, .comments, .social-share, .advertisement, .ad').remove();

    let title = selectors?.title
      ? this.cleanText($(selectors.title).first().text())
      : this.cleanText($('h1').first().text());

    // Fallback to og:title or document title
    if (!title) {
      title = $('meta[property="og:title"]').attr('content') ||
        $('title').first().text().trim() || '';
    }

    // Try multiple content selectors (comma-separated) individually
    let content = '';
    if (selectors?.content) {
      const selectorList = selectors.content.split(',').map(s => s.trim());
      for (const sel of selectorList) {
        const el = $(sel).first();
        if (el.length) {
          content = this.cleanText(el.text());
          if (content.length > 100) break;
        }
      }
    }
    if (!content) {
      content = this.cleanText($('article').first().text());
    }
    if (!content || content.length < 50) {
      // Fallback: get og:description or meta description
      content = $('meta[property="og:description"]').attr('content') ||
        $('meta[name="description"]').attr('content') || '';
    }

    const imageUrl = selectors?.image
      ? $(selectors.image).first().attr('src') ||
        $(selectors.image).first().attr('data-src') ||
        $(selectors.image).first().attr('content')
      : $('meta[property="og:image"]').attr('content');

    const author = selectors?.author
      ? this.cleanText($(selectors.author).first().text())
      : $('meta[name="author"]').attr('content') || '';

    let publishedAt: Date | undefined;
    if (selectors?.date) {
      // Try datetime attribute first, then text content
      const dateEl = $(selectors.date).first();
      const dateAttr = dateEl.attr('datetime') || dateEl.attr('content');
      const dateText = dateAttr || dateEl.text().trim();
      if (dateText) {
        const parsed = new Date(dateText);
        if (!isNaN(parsed.getTime())) {
          publishedAt = parsed;
        }
      }
    }
    if (!publishedAt) {
      const ogDate =
        $('meta[property="article:published_time"]').attr('content') ||
        $('time[datetime]').first().attr('datetime');
      if (ogDate) {
        const parsed = new Date(ogDate);
        if (!isNaN(parsed.getTime())) {
          publishedAt = parsed;
        }
      }
    }

    return { title, content, imageUrl, author, publishedAt };
  }
}
