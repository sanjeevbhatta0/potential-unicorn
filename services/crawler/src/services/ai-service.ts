import axios from 'axios';
import logger from '../utils/logger';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export interface AIProcessingResult {
    aiSummary: string;
    aiKeyPoints: string[];
    credibilityScore: number;
    category?: string;
}

/**
 * Process an article with AI to get Nepali summary, key points, and credibility score
 * This is called at crawl-time for new articles
 */
export async function processArticleWithAI(
    title: string,
    content: string,
    url?: string
): Promise<AIProcessingResult | null> {
    try {
        logger.info(`Processing article with AI: ${title.substring(0, 50)}...`);

        // Call summarize endpoint
        const summaryResponse = await axios.post(
            `${AI_SERVICE_URL}/api/v1/summarize`,
            {
                article: {
                    content: content.substring(0, 4000),
                    title: title,
                },
                provider: 'claude',
                length: 'medium',
                language: 'ne', // Nepali
            },
            { timeout: 60000 } // 60 second timeout
        );

        const summaryData = summaryResponse.data;

        // Call credibility endpoint
        let credibilityScore = 7; // Default score
        try {
            const credibilityResponse = await axios.post(
                `${AI_SERVICE_URL}/api/v1/credibility`,
                {
                    article: {
                        content: content.substring(0, 4000),
                        title: title,
                        url: url,
                    },
                },
                { timeout: 30000 }
            );
            credibilityScore = credibilityResponse.data.overall_score || 7;
        } catch (credError: any) {
            logger.warn(`Credibility check failed, using default score: ${credError.message}`);
        }

        const result: AIProcessingResult = {
            aiSummary: summaryData.summary,
            aiKeyPoints: summaryData.key_points || [],
            credibilityScore: credibilityScore,
            category: summaryData.category,
        };

        logger.info(`AI processing complete: ${result.aiKeyPoints.length} key points, score: ${credibilityScore}`);
        return result;

    } catch (error: any) {
        logger.error(`AI processing failed: ${error.message}`);
        // Return null to indicate failure - article will still be saved without AI data
        return null;
    }
}
