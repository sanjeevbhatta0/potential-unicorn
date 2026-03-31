import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import logger from '../utils/logger';
import { SourceConfig } from '../services/source-config.service';
import { discoverFeedUrl, fetchRSSArticles } from '../discovery/rss.discovery';
import { discoverSitemapUrl, fetchSitemapArticles } from '../discovery/sitemap.discovery';
import { isUrlAllowed, getCrawlDelay } from '../discovery/robots.checker';
import incrementalTracker from '../discovery/incremental.tracker';

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

type DiscoveryMethod = 'rss' | 'sitemap' | 'html';

/**
 * Generic crawler with a layered discovery pipeline:
 *   1. RSS feed (most reliable, structured metadata)
 *   2. News sitemap (structured, good for recent articles)
 *   3. HTML scraping (fallback, selector-based)
 *
 * Cross-cutting concerns applied to all methods:
 *   - robots.txt compliance
 *   - Incremental crawling (stop at previously-seen articles)
 *   - Per-site rate limiting (respects robots.txt Crawl-delay)
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

    // ─── Discovery Layer ──────────────────────────────────────────────

    /**
     * Try RSS feed for article discovery.
     */
    private async discoverViaRSS(): Promise<string[]> {
        const feedUrl = await discoverFeedUrl(
            this.source.baseUrl,
            this.source.crawlConfig?.rssFeedUrl
        );

        if (!feedUrl) return [];

        const rssArticles = await fetchRSSArticles(feedUrl, this.maxArticles);
        const urls = rssArticles.map(a => a.url).filter(Boolean);

        if (urls.length > 0) {
            logger.info(`[${this.source.name}] RSS discovery found ${urls.length} articles`);
        }

        return urls;
    }

    /**
     * Try sitemap for article discovery.
     */
    private async discoverViaSitemap(): Promise<string[]> {
        const sitemapUrl = this.source.crawlConfig?.sitemapUrl
            || await discoverSitemapUrl(this.source.baseUrl);

        if (!sitemapUrl) return [];

        const sitemapArticles = await fetchSitemapArticles(sitemapUrl, this.maxArticles);
        const urls = sitemapArticles.map(a => a.url).filter(Boolean);

        if (urls.length > 0) {
            logger.info(`[${this.source.name}] Sitemap discovery found ${urls.length} articles`);
        }

        return urls;
    }

    /**
     * Fallback: HTML scraping for article discovery.
     */
    private async discoverViaHTML(): Promise<string[]> {
        try {
            const html = await this.fetchHtml(this.source.baseUrl);
            const $ = cheerio.load(html);
            const links: string[] = [];
            const baseUrl = new URL(this.source.baseUrl);

            const articleSelector = this.source.crawlConfig?.selectors?.article || 'a[href]';

            $(articleSelector).each((_, el) => {
                let href = $(el).attr('href');
                if (!href) return;

                if (href.startsWith('/')) {
                    href = `${baseUrl.origin}${href}`;
                } else if (!href.startsWith('http')) {
                    return;
                }

                if (this.isArticleUrl(href)) {
                    links.push(href);
                }
            });

            const uniqueLinks = [...new Set(links)].slice(0, this.maxArticles);
            if (uniqueLinks.length > 0) {
                logger.info(`[${this.source.name}] HTML discovery found ${uniqueLinks.length} articles`);
            }
            return uniqueLinks;
        } catch (error: any) {
            logger.error(`[${this.source.name}] HTML discovery failed: ${error.message}`);
            return [];
        }
    }

    /**
     * Check if a URL looks like an article.
     */
    private isArticleUrl(url: string): boolean {
        const articlePatterns = [
            /\/\d{4}\/\d{2}\//,
            /\/news\//, /\/article\//, /\/story\//,
            /\/politics\//, /\/social\//, /\/business\//, /\/sports\//, /\/entertainment\//,
            /\/\d+\/?$/,
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

    // ─── Article Extraction ───────────────────────────────────────────

    /**
     * Extract article content from a page.
     */
    async extractArticle(url: string): Promise<Article | null> {
        try {
            // robots.txt check
            const allowed = await isUrlAllowed(url);
            if (!allowed) {
                logger.debug(`[${this.source.name}] Skipping disallowed URL: ${url}`);
                return null;
            }

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

            if (!title || title.length < 5 || !content || content.length < 100) {
                return null;
            }

            let image = selectors.image
                ? $(selectors.image).attr('src')
                : $('article img, .article img, [class*="featured"] img, meta[property="og:image"]').first().attr('content') ||
                $('article img, .article img').first().attr('src');

            let author = selectors.author
                ? $(selectors.author).text().trim()
                : $('[class*="author"], [rel="author"], .byline').first().text().trim();

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
            logger.warn(`[${this.source.name}] Failed to extract article from ${url}: ${error.message}`);
            return null;
        }
    }

    // ─── Main Crawl Pipeline ──────────────────────────────────────────

    /**
     * Crawl all articles from this source using the layered discovery pipeline.
     */
    async crawl(): Promise<Article[]> {
        logger.info(`[${this.source.name}] Starting crawl`);
        const articles: Article[] = [];

        // Respect robots.txt crawl delay if specified
        const robotsDelay = await getCrawlDelay(this.source.baseUrl);
        if (robotsDelay && robotsDelay > this.delayBetweenRequests) {
            logger.info(`[${this.source.name}] Respecting robots.txt crawl-delay: ${robotsDelay}ms`);
            this.delayBetweenRequests = robotsDelay;
        }

        // === Discovery: try methods in priority order ===
        let articleUrls: string[] = [];
        let method: DiscoveryMethod = 'html';

        // 1. Try RSS
        articleUrls = await this.discoverViaRSS();
        if (articleUrls.length > 0) {
            method = 'rss';
        }

        // 2. Try sitemap if RSS found nothing
        if (articleUrls.length === 0) {
            articleUrls = await this.discoverViaSitemap();
            if (articleUrls.length > 0) {
                method = 'sitemap';
            }
        }

        // 3. Fall back to HTML scraping
        if (articleUrls.length === 0) {
            articleUrls = await this.discoverViaHTML();
            method = 'html';
        }

        if (articleUrls.length === 0) {
            logger.warn(`[${this.source.name}] No article URLs discovered via any method`);
            return articles;
        }

        logger.info(`[${this.source.name}] Discovered ${articleUrls.length} URLs via ${method}`);

        // === Incremental filtering: skip already-seen articles ===
        const newUrls = await incrementalTracker.filterNewUrls(this.source.id, articleUrls);

        if (newUrls.length === 0) {
            logger.info(`[${this.source.name}] All articles already seen — skipping extraction`);
            return articles;
        }

        logger.info(`[${this.source.name}] ${newUrls.length} new articles to extract (${articleUrls.length - newUrls.length} skipped as seen)`);

        // === Extract full content for new articles ===
        for (const link of newUrls) {
            try {
                logger.info(`[${this.source.name}] Crawling: ${link}`);
                const article = await this.extractArticle(link);
                if (article) {
                    articles.push(article);
                }
            } catch (error: any) {
                logger.warn(`[${this.source.name}] Error crawling ${link}: ${error.message}`);
            }
        }

        // Mark all discovered URLs as seen (including ones that failed extraction)
        await incrementalTracker.markSeen(this.source.id, newUrls);

        logger.info(`[${this.source.name}] Crawled ${articles.length} articles via ${method}`);
        return articles;
    }
}
