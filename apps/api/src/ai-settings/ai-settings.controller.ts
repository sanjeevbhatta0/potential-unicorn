import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    ParseUUIDPipe,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AISettingsService } from './ai-settings.service';
import { CreateAISettingsDto, UpdateAISettingsDto } from './dto';
import { AIProvider } from '../database/entities/ai-settings.entity';
import { AdminGuard, AdminOnly } from '../common/guards/admin.guard';
import axios from 'axios';

@ApiTags('ai-settings')
@ApiBearerAuth('JWT-auth')
@UseGuards(AdminGuard)
@AdminOnly()
@Controller('ai-settings')
export class AISettingsController {
    constructor(private readonly aiSettingsService: AISettingsService) { }

    @Get()
    @ApiOperation({ summary: 'List all AI configurations' })
    @ApiResponse({ status: 200, description: 'List of AI settings' })
    async findAll() {
        return this.aiSettingsService.findAll();
    }

    @Get('providers')
    @ApiOperation({ summary: 'List available AI providers' })
    @ApiResponse({ status: 200, description: 'List of providers' })
    getProviders() {
        return this.aiSettingsService.getAvailableProviders();
    }

    @Get('providers/:provider/models')
    @ApiOperation({ summary: 'List available models for a provider' })
    @ApiResponse({ status: 200, description: 'List of models' })
    getModelsForProvider(@Param('provider') provider: AIProvider) {
        return this.aiSettingsService.getModelsForProvider(provider);
    }

    @Get('default')
    @ApiOperation({ summary: 'Get the default AI configuration' })
    @ApiResponse({ status: 200, description: 'Default AI setting' })
    async getDefault() {
        return this.aiSettingsService.findDefault();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get an AI configuration by ID' })
    @ApiResponse({ status: 200, description: 'AI setting details' })
    @ApiResponse({ status: 404, description: 'Not found' })
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.aiSettingsService.findOne(id);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new AI configuration' })
    @ApiResponse({ status: 201, description: 'AI setting created' })
    async create(@Body() dto: CreateAISettingsDto) {
        return this.aiSettingsService.create(dto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update an AI configuration' })
    @ApiResponse({ status: 200, description: 'AI setting updated' })
    @ApiResponse({ status: 404, description: 'Not found' })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateAISettingsDto,
    ) {
        return this.aiSettingsService.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete an AI configuration' })
    @ApiResponse({ status: 204, description: 'AI setting deleted' })
    @ApiResponse({ status: 404, description: 'Not found' })
    async remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.aiSettingsService.remove(id);
    }

    @Post(':id/set-default')
    @ApiOperation({ summary: 'Set an AI configuration as default' })
    @ApiResponse({ status: 200, description: 'Set as default' })
    @ApiResponse({ status: 404, description: 'Not found' })
    async setDefault(@Param('id', ParseUUIDPipe) id: string) {
        return this.aiSettingsService.setDefault(id);
    }

    @Post(':id/test')
    @ApiOperation({ summary: 'Test an AI configuration' })
    @ApiResponse({ status: 200, description: 'Test result' })
    @ApiResponse({ status: 404, description: 'Not found' })
    async testConnection(@Param('id', ParseUUIDPipe) id: string) {
        const setting = await this.aiSettingsService.findOne(id);
        const apiKey = await this.aiSettingsService.getDecryptedApiKey(id);

        try {
            let success = false;
            let message = '';

            switch (setting.provider) {
                case 'openai':
                    success = await this.testOpenAI(apiKey);
                    break;
                case 'anthropic':
                    success = await this.testAnthropic(apiKey);
                    break;
                case 'gemini':
                    success = await this.testGemini(apiKey);
                    break;
                case 'perplexity':
                    success = await this.testPerplexity(apiKey);
                    break;
                case 'groq':
                    success = await this.testGroq(apiKey);
                    break;
                case 'mistral':
                    success = await this.testMistral(apiKey);
                    break;
                default:
                    message = 'Unknown provider';
            }

            await this.aiSettingsService.updateTestStatus(id, success);

            return {
                success,
                message: success ? 'Connection successful' : message || 'Connection failed',
                testedAt: new Date().toISOString(),
            };
        } catch (error: any) {
            await this.aiSettingsService.updateTestStatus(id, false);
            return {
                success: false,
                message: error.message || 'Connection failed',
                testedAt: new Date().toISOString(),
            };
        }
    }

    private async testOpenAI(apiKey: string): Promise<boolean> {
        const response = await axios.get('https://api.openai.com/v1/models', {
            headers: { Authorization: `Bearer ${apiKey}` },
            timeout: 10000,
        });
        return response.status === 200;
    }

    private async testAnthropic(apiKey: string): Promise<boolean> {
        // Anthropic doesn't have a simple test endpoint, so we make a minimal request
        const response = await axios.post(
            'https://api.anthropic.com/v1/messages',
            {
                model: 'claude-3-5-haiku-20241022',
                max_tokens: 10,
                messages: [{ role: 'user', content: 'Hi' }],
            },
            {
                headers: {
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                    'Content-Type': 'application/json',
                },
                timeout: 15000,
            },
        );
        return response.status === 200;
    }

    private async testGemini(apiKey: string): Promise<boolean> {
        const response = await axios.get(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
            { timeout: 10000 },
        );
        return response.status === 200;
    }

    private async testPerplexity(apiKey: string): Promise<boolean> {
        const response = await axios.post(
            'https://api.perplexity.ai/chat/completions',
            {
                model: 'sonar',
                messages: [{ role: 'user', content: 'Hi' }],
                max_tokens: 10,
            },
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                timeout: 15000,
            },
        );
        return response.status === 200;
    }

    private async testGroq(apiKey: string): Promise<boolean> {
        const response = await axios.get('https://api.groq.com/openai/v1/models', {
            headers: { Authorization: `Bearer ${apiKey}` },
            timeout: 10000,
        });
        return response.status === 200;
    }

    private async testMistral(apiKey: string): Promise<boolean> {
        const response = await axios.get('https://api.mistral.ai/v1/models', {
            headers: { Authorization: `Bearer ${apiKey}` },
            timeout: 10000,
        });
        return response.status === 200;
    }
}
