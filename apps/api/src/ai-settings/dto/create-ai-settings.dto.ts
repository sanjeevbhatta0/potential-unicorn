import { IsString, IsEnum, IsBoolean, IsOptional, ValidateNested, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AIProvider } from '../../database/entities/ai-settings.entity';

export class AIModelConfigDto {
    @ApiPropertyOptional({ description: 'Model temperature (0-2)', default: 0.7 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(2)
    temperature?: number;

    @ApiPropertyOptional({ description: 'Maximum tokens in response', default: 4096 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(128000)
    maxTokens?: number;

    @ApiPropertyOptional({ description: 'Top P sampling', default: 1 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(1)
    topP?: number;
}

export class CreateAISettingsDto {
    @ApiProperty({
        enum: ['openai', 'anthropic', 'gemini', 'perplexity', 'groq', 'mistral'],
        description: 'AI provider'
    })
    @IsEnum(['openai', 'anthropic', 'gemini', 'perplexity', 'groq', 'mistral'])
    provider: AIProvider;

    @ApiProperty({ description: 'Display name for this configuration', example: 'GPT-4 Turbo' })
    @IsString()
    name: string;

    @ApiProperty({ description: 'Model identifier', example: 'gpt-4-turbo' })
    @IsString()
    modelId: string;

    @ApiProperty({ description: 'API key for the provider' })
    @IsString()
    apiKey: string;

    @ApiPropertyOptional({ description: 'Whether this config is active', default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({ description: 'Model configuration options' })
    @IsOptional()
    @ValidateNested()
    @Type(() => AIModelConfigDto)
    config?: AIModelConfigDto;
}
