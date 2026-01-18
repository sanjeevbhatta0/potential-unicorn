import axios from 'axios';
import logger from '../utils/logger';

export interface SourceConfig {
    id: string;
    name: string;
    type: 'website' | 'youtube';
    baseUrl: string;
    language: 'ne' | 'en';
    isActive: boolean;
    crawlConfig: {
        enabled: boolean;
        interval?: number;
        maxArticles?: number;
        selectors?: {
            article?: string;
            title?: string;
            content?: string;
            image?: string;
            author?: string;
            date?: string;
        };
    } | null;
    lastCrawledAt: string | null;
}

const API_URL = process.env.API_URL || 'http://localhost:3333';

/**
 * Fetch active sources from the API
 */
export async function fetchSourcesFromAPI(): Promise<SourceConfig[]> {
    try {
        logger.info('Fetching sources from API...');
        const response = await axios.get(`${API_URL}/api/v1/sources/active`, { timeout: 10000 });

        // Handle wrapped response
        const data = response.data;
        const sources = Array.isArray(data) ? data : (data.data || []);

        // Filter only enabled sources
        const enabledSources = sources.filter((source: SourceConfig) =>
            source.isActive && source.crawlConfig?.enabled !== false
        );

        logger.info(`Found ${enabledSources.length} active sources`);
        return enabledSources;
    } catch (error: any) {
        logger.error(`Failed to fetch sources from API: ${error.message}`);
        return [];
    }
}

/**
 * Update last crawled timestamp for a source
 */
export async function updateLastCrawled(sourceId: string): Promise<void> {
    try {
        await axios.patch(`${API_URL}/api/v1/sources/${sourceId}`, {
            lastCrawledAt: new Date().toISOString(),
        }, { timeout: 10000 });
    } catch (error: any) {
        logger.warn(`Failed to update lastCrawledAt for source ${sourceId}: ${error.message}`);
    }
}
