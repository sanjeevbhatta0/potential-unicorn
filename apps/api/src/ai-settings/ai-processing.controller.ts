import {
    Controller,
    Post,
    Body,
    Headers,
    UnauthorizedException,
    BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AISettingsService } from './ai-settings.service';
import { Public } from '../common/decorators/public.decorator';
import axios from 'axios';

/**
 * Internal AI Processing Controller
 * Provides AI summarization using database-stored API keys
 * Used by the crawler service to process articles
 */
@ApiTags('ai')
@Controller('ai')
export class AIProcessingController {
    constructor(private readonly aiSettingsService: AISettingsService) { }

    @Post('summarize')
    @Public()
    @ApiOperation({ summary: 'Summarize content using configured AI provider' })
    @ApiResponse({ status: 200, description: 'Summary generated' })
    @ApiResponse({ status: 401, description: 'Invalid API key' })
    async summarize(
        @Headers('x-api-key') apiKey: string,
        @Body() body: {
            title: string;
            content: string;
            language?: string;
        },
    ) {
        // Validate internal API key
        const validApiKey = process.env.CRAWLER_API_KEY || 'crawler-secret-key-2026';
        if (apiKey !== validApiKey) {
            throw new UnauthorizedException('Invalid API key');
        }

        try {
            // Get the default AI provider from database
            const defaultProvider = await this.aiSettingsService.findDefault();
            if (!defaultProvider) {
                throw new BadRequestException('No default AI provider configured');
            }

            // Get the decrypted API key
            const providerApiKey = await this.aiSettingsService.getDecryptedApiKey(defaultProvider.id);
            if (!providerApiKey) {
                throw new BadRequestException('AI provider API key not found');
            }

            const { title, content, language = 'ne' } = body;
            const truncatedContent = content.substring(0, 4000);

            // Build the prompt
            const prompt = this.buildPrompt(title, truncatedContent, language);

            let result;

            // Call the appropriate provider
            switch (defaultProvider.provider) {
                case 'gemini':
                    result = await this.callGemini(providerApiKey, defaultProvider.modelId, prompt);
                    break;
                case 'anthropic':
                    result = await this.callAnthropic(providerApiKey, defaultProvider.modelId, prompt);
                    break;
                case 'openai':
                    result = await this.callOpenAI(providerApiKey, defaultProvider.modelId, prompt);
                    break;
                default:
                    throw new BadRequestException(`Unsupported provider: ${defaultProvider.provider}`);
            }

            return {
                success: true,
                summary: result.summary,
                key_points: result.keyPoints,
                category: result.category,
                credibility_score: result.credibilityScore || 7,
                provider: defaultProvider.provider,
                model: defaultProvider.modelId,
            };
        } catch (error: any) {
            console.error('AI summarization error:', error.message);
            throw new BadRequestException(`AI processing failed: ${error.message}`);
        }
    }

    private buildPrompt(title: string, content: string, language: string): string {
        const langText = language === 'ne' ? 'Nepali' : 'English';
        return `You are an expert content summarizer and classifier.

Your task is to:
1. Create a clear, concise summary of approximately 100-150 words in ${langText}
2. Extract 3-5 key points
3. Classify the article into ONE of these categories: Politics, Sports, Entertainment, Business, Technology, Health, Education, International, Opinion, General
4. Provide a credibility score from 1-10 based on the content quality

IMPORTANT: Respond in this exact JSON format:
{
  "summary": "your summary here",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "category": "category name",
  "credibilityScore": 7
}

Article Title: ${title}

Article Content:
${content}`;
    }

    private async callGemini(apiKey: string, model: string, prompt: string) {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1024,
                },
            },
            { timeout: 60000 }
        );

        const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return this.parseAIResponse(text);
    }

    private async callAnthropic(apiKey: string, model: string, prompt: string) {
        const response = await axios.post(
            'https://api.anthropic.com/v1/messages',
            {
                model,
                max_tokens: 1024,
                messages: [{ role: 'user', content: prompt }],
            },
            {
                headers: {
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                    'Content-Type': 'application/json',
                },
                timeout: 60000,
            }
        );

        const text = response.data.content?.[0]?.text || '';
        return this.parseAIResponse(text);
    }

    private async callOpenAI(apiKey: string, model: string, prompt: string) {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 1024,
                temperature: 0.7,
            },
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                timeout: 60000,
            }
        );

        const text = response.data.choices?.[0]?.message?.content || '';
        return this.parseAIResponse(text);
    }

    private parseAIResponse(text: string): {
        summary: string;
        keyPoints: string[];
        category: string;
        credibilityScore: number;
    } {
        try {
            // Try to parse as JSON
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    summary: parsed.summary || text.substring(0, 500),
                    keyPoints: parsed.keyPoints || [],
                    category: this.normalizeCategory(parsed.category),
                    credibilityScore: parsed.credibilityScore || 7,
                };
            }
        } catch (e) {
            // Parse failed, use fallback
        }

        // Fallback: use the text as summary
        return {
            summary: text.substring(0, 500),
            keyPoints: [],
            category: 'general',
            credibilityScore: 7,
        };
    }

    private normalizeCategory(category: string): string {
        if (!category) return 'general';

        const validCategories = [
            'politics', 'sports', 'entertainment', 'business',
            'technology', 'health', 'education', 'international',
            'opinion', 'general'
        ];

        const normalized = category.toLowerCase().trim();
        return validCategories.includes(normalized) ? normalized : 'general';
    }
}
