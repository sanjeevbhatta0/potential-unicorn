import {
    Controller,
    Post,
    Get,
    Body,
    Headers,
    UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AIProcessingService } from './ai-processing.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('ai')
@Controller('ai')
export class AIProcessingController {
    constructor(private readonly aiProcessingService: AIProcessingService) {}

    @Post('summarize')
    @Public()
    @ApiOperation({ summary: 'Summarize content using configured AI provider' })
    @ApiResponse({ status: 200, description: 'Summary generated' })
    @ApiResponse({ status: 401, description: 'Invalid API key' })
    async summarize(
        @Headers('x-api-key') apiKey: string,
        @Body() body: { title: string; content: string; language?: string },
    ) {
        const validApiKey = process.env.CRAWLER_API_KEY || 'crawler-secret-key-2026';
        if (apiKey !== validApiKey) {
            throw new UnauthorizedException('Invalid API key');
        }

        const result = await this.aiProcessingService.summarizeArticle(
            body.title,
            body.content,
            body.language || 'ne',
        );

        return {
            success: true,
            summary: result.summary,
            key_points: result.keyPoints,
            category: result.category,
            credibility_score: result.credibilityScore,
            provider: result.provider,
            model: result.model,
        };
    }

    @Get('usage')
    @Public()
    @ApiOperation({ summary: 'Get AI usage statistics and cost estimates' })
    @ApiResponse({ status: 200, description: 'Usage stats returned' })
    async getUsage(@Headers('x-api-key') apiKey: string) {
        const validApiKey = process.env.CRAWLER_API_KEY || 'crawler-secret-key-2026';
        if (apiKey !== validApiKey) {
            throw new UnauthorizedException('Invalid API key');
        }
        return this.aiProcessingService.getUsageStats();
    }
}
