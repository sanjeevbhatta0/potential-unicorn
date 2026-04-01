import axios from 'axios';
import * as cheerio from 'cheerio';
import logger from '../utils/logger';

export interface SitemapArticle {
  url: string;
  lastModified?: string;
  title?: string;
  publishDate?: string;
  keywords?: string[];
}

/**
 * Well-known sitemap paths to try
 */
const SITEMAP_PATHS = [
  '/sitemap-news.xml',
  '/news-sitemap.xml',
  '/sitemap.xml',
  '/sitemap_index.xml',
  '/sitemaps/sitemap.xml',
];

/**
 * Discover sitemap URL from robots.txt or common paths
 */
export async function discoverSitemapUrl(baseUrl: string): Promise<string | null> {
  const origin = new URL(baseUrl).origin;

  // 1. Check robots.txt for Sitemap directive
  try {
    const robotsResponse = await axios.get(`${origin}/robots.txt`, {
      timeout: 10000,
      headers: { 'User-Agent': 'NewsChautari/1.0' },
    });

    const sitemapMatch = robotsResponse.data.match(/Sitemap:\s*(.+)/i);
    if (sitemapMatch) {
      const sitemapUrl = sitemapMatch[1].trim();
      logger.info(`Found sitemap in robots.txt for ${baseUrl}: ${sitemapUrl}`);
      return sitemapUrl;
    }
  } catch {
    // robots.txt not available
  }

  // 2. Probe common paths
  for (const path of SITEMAP_PATHS) {
    const sitemapUrl = `${origin}${path}`;
    try {
      const response = await axios.head(sitemapUrl, {
        timeout: 8000,
        headers: { 'User-Agent': 'NewsChautari/1.0' },
        validateStatus: (status) => status < 400,
      });

      const contentType = response.headers['content-type'] || '';
      if (contentType.includes('xml') || contentType.includes('text')) {
        return sitemapUrl;
      }
    } catch {
      // Not found, try next
    }
  }

  return null;
}

/**
 * Parse a sitemap XML and extract article URLs.
 * Handles both regular sitemaps and news sitemaps (Google News sitemap protocol).
 */
export async function fetchSitemapArticles(
  sitemapUrl: string,
  maxArticles: number = 100
): Promise<SitemapArticle[]> {
  try {
    logger.info(`Fetching sitemap: ${sitemapUrl}`);
    const response = await axios.get(sitemapUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'NewsChautari/1.0',
        Accept: 'application/xml, text/xml',
      },
    });

    const $ = cheerio.load(response.data, { xmlMode: true });
    const articles: SitemapArticle[] = [];

    // Check if this is a sitemap index (contains other sitemaps)
    const sitemapLinks = $('sitemapindex sitemap loc');
    if (sitemapLinks.length > 0) {
      // It's an index — look for news sitemaps first
      const newsSitemaps: string[] = [];
      sitemapLinks.each((_, el) => {
        const loc = $(el).text().trim();
        if (loc.includes('news') || loc.includes('post') || loc.includes('article')) {
          newsSitemaps.push(loc);
        }
      });

      // Fetch the first news-related sitemap (or the first sitemap if none match)
      const targetSitemap = newsSitemaps[0] || sitemapLinks.first().text().trim();
      if (targetSitemap) {
        logger.info(`Following sitemap index to: ${targetSitemap}`);
        return fetchSitemapArticles(targetSitemap, maxArticles);
      }
    }

    // Parse <url> entries
    const urlElements = $('urlset url').toArray();
    for (const el of urlElements) {
      if (articles.length >= maxArticles) break;

      const loc = $(el).find('loc').text().trim();
      if (!loc) continue;

      const lastmod = $(el).find('lastmod').text().trim();

      // News sitemap fields
      const newsTitle = $(el).find('news\\:title, title').text().trim();
      const newsPubDate = $(el).find('news\\:publication_date, publication_date').text().trim();
      const newsKeywords = $(el).find('news\\:keywords, keywords').text().trim();

      articles.push({
        url: loc,
        lastModified: lastmod || undefined,
        title: newsTitle || undefined,
        publishDate: newsPubDate || undefined,
        keywords: newsKeywords ? newsKeywords.split(',').map((k) => k.trim()) : undefined,
      });
    }

    // Sort by most recent first
    articles.sort((a, b) => {
      const dateA = a.publishDate || a.lastModified || '';
      const dateB = b.publishDate || b.lastModified || '';
      return dateB.localeCompare(dateA);
    });

    logger.info(`Parsed ${articles.length} articles from sitemap ${sitemapUrl}`);
    return articles.slice(0, maxArticles);
  } catch (error: any) {
    logger.warn(`Failed to fetch sitemap ${sitemapUrl}: ${error.message}`);
    return [];
  }
}
