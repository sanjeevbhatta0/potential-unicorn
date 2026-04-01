import axios from 'axios';
import robotsParser from 'robots-parser';
import logger from '../utils/logger';

/**
 * Cache of parsed robots.txt per origin.
 * Avoids re-fetching on every URL check within the same crawl cycle.
 */
const robotsCache = new Map<string, { parser: ReturnType<typeof robotsParser>; fetchedAt: number }>();

const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const USER_AGENT = 'NewsChautari';

/**
 * Fetch and parse robots.txt for a given origin.
 */
async function getRobotsParser(origin: string): Promise<ReturnType<typeof robotsParser> | null> {
  // Check cache
  const cached = robotsCache.get(origin);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.parser;
  }

  try {
    const robotsUrl = `${origin}/robots.txt`;
    const response = await axios.get(robotsUrl, {
      timeout: 10000,
      headers: { 'User-Agent': USER_AGENT },
      validateStatus: (status) => status < 500, // 404 = no robots.txt = allow all
    });

    if (response.status === 404 || !response.data) {
      // No robots.txt — everything is allowed
      const emptyParser = robotsParser(`${origin}/robots.txt`, '');
      robotsCache.set(origin, { parser: emptyParser, fetchedAt: Date.now() });
      return emptyParser;
    }

    const parser = robotsParser(robotsUrl, response.data);
    robotsCache.set(origin, { parser, fetchedAt: Date.now() });

    logger.debug(`Loaded robots.txt for ${origin}`);
    return parser;
  } catch (error: any) {
    logger.warn(`Failed to fetch robots.txt for ${origin}: ${error.message}`);
    // On error, allow crawling (fail open — same as most crawlers)
    return null;
  }
}

/**
 * Check whether a URL is allowed by robots.txt.
 * Returns true if allowed (or if robots.txt is unavailable).
 */
export async function isUrlAllowed(url: string): Promise<boolean> {
  try {
    const origin = new URL(url).origin;
    const parser = await getRobotsParser(origin);

    if (!parser) {
      return true; // Fail open
    }

    const allowed = parser.isAllowed(url, USER_AGENT);
    if (allowed === false) {
      logger.info(`robots.txt disallows: ${url}`);
    }
    // robots-parser returns undefined for "no matching rule" (which means allowed)
    return allowed !== false;
  } catch {
    return true;
  }
}

/**
 * Get the crawl delay specified in robots.txt (if any).
 * Returns delay in milliseconds, or null if not specified.
 */
export async function getCrawlDelay(baseUrl: string): Promise<number | null> {
  try {
    const origin = new URL(baseUrl).origin;
    const parser = await getRobotsParser(origin);

    if (!parser) return null;

    const delay = parser.getCrawlDelay(USER_AGENT);
    if (delay) {
      logger.info(`robots.txt crawl-delay for ${origin}: ${delay}s`);
      return delay * 1000; // Convert to ms
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Clear the robots.txt cache (useful between crawl cycles).
 */
export function clearRobotsCache(): void {
  robotsCache.clear();
}
