import Parser from 'rss-parser';
import axios from 'axios';
import * as cheerio from 'cheerio';
import logger from '../utils/logger';

export interface RSSArticle {
  url: string;
  title: string;
  publishDate?: string;
  author?: string;
  category?: string;
  summary?: string;
}

const parser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 'NewsChautari/1.0 (news aggregator)',
    Accept: 'application/rss+xml, application/xml, text/xml',
  },
});

/**
 * Well-known RSS feed paths to try for auto-discovery
 */
const COMMON_FEED_PATHS = [
  '/feed',
  '/rss',
  '/feed/rss',
  '/rss.xml',
  '/feed.xml',
  '/atom.xml',
  '/feeds/posts/default',
];

/**
 * Discover RSS feed URL from a site's HTML <link> tags
 */
async function discoverFeedFromHtml(baseUrl: string): Promise<string | null> {
  try {
    const response = await axios.get(baseUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'NewsChautari/1.0 (news aggregator)',
        Accept: 'text/html',
      },
    });

    const $ = cheerio.load(response.data);

    // Look for <link rel="alternate" type="application/rss+xml" ...>
    const feedLink = $(
      'link[type="application/rss+xml"], link[type="application/atom+xml"]'
    ).first();

    const href = feedLink.attr('href');
    if (href) {
      // Make absolute URL if relative
      if (href.startsWith('http')) return href;
      return new URL(href, baseUrl).href;
    }

    return null;
  } catch (error: any) {
    logger.debug(`Failed to discover feed from HTML for ${baseUrl}: ${error.message}`);
    return null;
  }
}

/**
 * Try common feed paths to find an RSS feed
 */
async function discoverFeedByProbing(baseUrl: string): Promise<string | null> {
  const origin = new URL(baseUrl).origin;

  for (const path of COMMON_FEED_PATHS) {
    const feedUrl = `${origin}${path}`;
    try {
      const response = await axios.head(feedUrl, {
        timeout: 8000,
        headers: { 'User-Agent': 'NewsChautari/1.0' },
        validateStatus: (status) => status < 400,
      });

      const contentType = response.headers['content-type'] || '';
      if (
        contentType.includes('xml') ||
        contentType.includes('rss') ||
        contentType.includes('atom')
      ) {
        return feedUrl;
      }
    } catch {
      // Not found, try next path
    }
  }

  return null;
}

/**
 * Discover the RSS feed URL for a given site.
 * Tries: 1) explicit feedUrl, 2) HTML <link> discovery, 3) common path probing
 */
export async function discoverFeedUrl(
  baseUrl: string,
  explicitFeedUrl?: string
): Promise<string | null> {
  // If explicit feed URL provided, use it directly
  if (explicitFeedUrl) {
    return explicitFeedUrl;
  }

  // Try HTML auto-discovery
  const htmlFeed = await discoverFeedFromHtml(baseUrl);
  if (htmlFeed) {
    logger.info(`Discovered RSS feed via HTML for ${baseUrl}: ${htmlFeed}`);
    return htmlFeed;
  }

  // Try common paths
  const probedFeed = await discoverFeedByProbing(baseUrl);
  if (probedFeed) {
    logger.info(`Discovered RSS feed via probing for ${baseUrl}: ${probedFeed}`);
    return probedFeed;
  }

  logger.debug(`No RSS feed found for ${baseUrl}`);
  return null;
}

/**
 * Fetch and parse articles from an RSS feed.
 * Returns structured article metadata (still need to scrape full content separately).
 */
export async function fetchRSSArticles(
  feedUrl: string,
  maxItems: number = 50
): Promise<RSSArticle[]> {
  try {
    logger.info(`Fetching RSS feed: ${feedUrl}`);
    const feed = await parser.parseURL(feedUrl);

    const articles: RSSArticle[] = [];
    const items = feed.items.slice(0, maxItems);

    for (const item of items) {
      if (!item.link) continue;

      articles.push({
        url: item.link,
        title: item.title?.trim() || '',
        publishDate: item.pubDate || item.isoDate,
        author: item.creator || item['dc:creator'],
        category: item.categories?.[0],
        summary: item.contentSnippet?.trim(),
      });
    }

    logger.info(`Parsed ${articles.length} articles from RSS feed ${feedUrl}`);
    return articles;
  } catch (error: any) {
    logger.warn(`Failed to fetch RSS feed ${feedUrl}: ${error.message}`);
    return [];
  }
}
