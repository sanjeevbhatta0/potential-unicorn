import axios from 'axios';
import logger from '../utils/logger';

// Use the NestJS API for AI processing (it fetches API keys from database)
const API_URL = process.env.API_URL || 'http://localhost:3333';
const API_KEY = process.env.API_KEY || 'crawler-secret-key-2026';

export interface AIProcessingResult {
    aiSummary: string;
    aiKeyPoints: string[];
    credibilityScore: number;
    category?: string;
}

/**
 * Process an article with AI to get summary, key points, and credibility score.
 * This calls the NestJS API's internal AI endpoint which fetches the API key
 * from the database and calls the configured AI provider (Gemini, Claude, etc.)
 */
export async function processArticleWithAI(
    title: string,
    content: string,
    url?: string
): Promise<AIProcessingResult | null> {
    try {
        logger.info(`Processing article with AI: ${title.substring(0, 50)}...`);

        // Call the NestJS API's internal AI summarize endpoint
        const response = await axios.post(
            `${API_URL}/api/v1/ai/summarize`,
            {
                title: title,
                content: content.substring(0, 4000),
                language: 'ne', // Nepali
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': API_KEY,
                },
                timeout: 90000, // 90 second timeout for AI processing
            }
        );

        const responseData = response.data;

        // NestJS wraps the response: { success: true, data: { success: true, summary: ... } }
        // Extract the actual AI response from the nested structure
        const aiData = responseData.data || responseData;

        if (!aiData.success && !aiData.summary) {
            logger.warn(`AI processing returned unsuccessful: ${aiData.message || 'Unknown error'}`);
            return null;
        }

        const result: AIProcessingResult = {
            aiSummary: aiData.summary || '',
            aiKeyPoints: aiData.key_points || [],
            credibilityScore: aiData.credibility_score || 7,
            category: aiData.category,
        };

        logger.info(`AI processing complete: ${result.aiKeyPoints.length} key points, category: ${result.category}, score: ${result.credibilityScore}`);
        return result;

    } catch (error: any) {
        logger.error(`AI processing failed: ${error.message}`);
        // Return null to indicate failure - article will still be saved without AI data
        return null;
    }
}

