import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import logger from '../utils/logger';
import { SourceConfig } from '../services/source-config.service';

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
    sourceId: string;
    crawledAt: Date;
}

/**
 * Generic crawler that works with any source configuration from the database
 */
export class GenericCrawler {
    private source: SourceConfig;
    private axiosInstance: AxiosInstance;
    private lastRequestTime: number = 0;
    private delayBetweenRequests: number = 1000;

    constructor(source: SourceConfig) {
        this.source = source;
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

    get sourceName(): string {
        return this.source.name;
    }

    get sourceId(): string {
        return this.source.id;
    }

    get maxArticles(): number {
        return this.source.crawlConfig?.maxArticles || 50;
    }

    private async sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async respectRateLimit(): Promise<void> {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        const delayNeeded = this.delayBetweenRequests - timeSinceLastRequest;

        if (delayNeeded > 0) {
            await this.sleep(delayNeeded);
        }

        this.lastRequestTime = Date.now();
    }

    private async fetchHtml(url: string): Promise<string> {
        await this.respectRateLimit();

        const maxRetries = 3;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await this.axiosInstance.get(url);
                return response.data;
            } catch (error: any) {
                logger.warn(`Failed to fetch ${url} (attempt ${attempt}/${maxRetries}): ${error.message}`);
                if (attempt < maxRetries) {
                    await this.sleep(2000 * attempt);
                }
            }
        }
        throw new Error(`Failed to fetch ${url}`);
    }

    /**
     * Find article links on the homepage
     */
    async findArticleLinks(): Promise<string[]> {
        try {
            const html = await this.fetchHtml(this.source.baseUrl);
            const $ = cheerio.load(html);
            const links: string[] = [];
            const baseUrl = new URL(this.source.baseUrl);

            // Use custom selector if provided, otherwise use common patterns
            const articleSelector = this.source.crawlConfig?.selectors?.article || 'a[href]';

            $(articleSelector).each((_, el) => {
                let href = $(el).attr('href');
                if (!href) return;

                // Convert relative URLs to absolute
                if (href.startsWith('/')) {
                    href = `${baseUrl.origin}${href}`;
                } else if (!href.startsWith('http')) {
                    return; // Skip non-http links
                }

                // Filter to only include article-like URLs
                if (this.isArticleUrl(href)) {
                    links.push(href);
                }
            });

            // Remove duplicates and limit
            const uniqueLinks = [...new Set(links)].slice(0, this.maxArticles);
            logger.info(`Found ${uniqueLinks.length} article links for ${this.source.name}`);
            return uniqueLinks;
        } catch (error: any) {
            logger.error(`Failed to find article links for ${this.source.name}: ${error.message}`);
            return [];
        }
    }

    /**
     * Check if a URL looks like an article
     */
    private isArticleUrl(url: string): boolean {
        const articlePatterns = [
            /\/\d{4}\/\d{2}\//, // Date patterns: /2024/01/
            /\/news\//, /\/article\//, /\/story\//,
            /\/politics\//, /\/social\//, /\/business\//, /\/sports\//, /\/entertainment\//,
            /\/\d+\/?$/, // Ends with number (article ID)
        ];

        const excludePatterns = [
            /\.(jpg|png|gif|pdf|css|js)$/i,
            /\/tag\//, /\/category\//, /\/author\//,
            /facebook\.com/, /twitter\.com/, /youtube\.com/,
            /login/, /register/, /search/,
        ];

        const isArticle = articlePatterns.some(p => p.test(url));
        const isExcluded = excludePatterns.some(p => p.test(url));

        return isArticle && !isExcluded;
    }

    /**
     * Extract article content from a page
     */
    async extractArticle(url: string): Promise<Article | null> {
        try {
            const html = await this.fetchHtml(url);
            const $ = cheerio.load(html);
            const selectors = this.source.crawlConfig?.selectors || {};

            // Extract title
            let title = selectors.title
                ? $(selectors.title).first().text().trim()
                : $('h1').first().text().trim() || $('title').text().trim();

            // Extract content
            let content = '';
            if (selectors.content) {
                content = $(selectors.content).text().trim();
            } else {
                // Try common content selectors
                const contentSelectors = [
                    'article', '.article-content', '.post-content', '.entry-content',
                    '.news-content', '.story-content', '.main-content', '[class*="article"]',
                ];
                for (const sel of contentSelectors) {
                    const text = $(sel).first().text().trim();
                    if (text && text.length > content.length) {
                        content = text;
                    }
                }
            }

            // Skip if no meaningful content
            if (!title || title.length < 5 || !content || content.length < 100) {
                return null;
            }

            // Extract image
            let image = selectors.image
                ? $(selectors.image).attr('src')
                : $('article img, .article img, [class*="featured"] img, meta[property="og:image"]').first().attr('content') ||
                $('article img, .article img').first().attr('src');

            // Extract author
            let author = selectors.author
                ? $(selectors.author).text().trim()
                : $('[class*="author"], [rel="author"], .byline').first().text().trim();

            // Extract date
            let publishDate = selectors.date
                ? $(selectors.date).text().trim()
                : $('time, [class*="date"], [class*="published"]').first().attr('datetime') ||
                $('time, [class*="date"]').first().text().trim();

            return {
                url,
                title: title.substring(0, 500),
                content: content.substring(0, 50000),
                author: author?.substring(0, 200),
                publishDate,
                image,
                source: this.source.name,
                sourceId: this.source.id,
                crawledAt: new Date(),
            };
        } catch (error: any) {
            logger.warn(`Failed to extract article from ${url}: ${error.message}`);
            return null;
        }
    }

    /**
     * Crawl all articles from this source
     */
    async crawl(): Promise<Article[]> {
        logger.info(`Starting crawl for ${this.source.name}`);
        const articles: Article[] = [];

        try {
            const links = await this.findArticleLinks();

            for (const link of links) {
                try {
                    logger.info(`Crawling: ${link}`);
                    const article = await this.extractArticle(link);
                    if (article) {
                        articles.push(article);
                    }
                } catch (error: any) {
                    logger.warn(`Error crawling ${link}: ${error.message}`);
                }
            }

            logger.info(`Crawled ${articles.length} articles from ${this.source.name}`);
            return articles;
        } catch (error: any) {
            logger.error(`Crawl failed for ${this.source.name}: ${error.message}`);
            return articles;
        }
    }
}
