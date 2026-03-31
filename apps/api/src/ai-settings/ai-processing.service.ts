import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AISettingsService } from './ai-settings.service';
import axios from 'axios';

export interface AISummaryResult {
  summary: string;
  keyPoints: string[];
  category: string;
  credibilityScore: number;
  provider: string;
  model: string;
  estimatedTokens: number;
  estimatedCost: number;
}

// Simple in-memory usage log (persists per cold start)
export interface AIUsageEntry {
  timestamp: Date;
  provider: string;
  model: string;
  articleId?: string;
  estimatedTokens: number;
  estimatedCost: number;
  success: boolean;
}

@Injectable()
export class AIProcessingService {
  private readonly logger = new Logger(AIProcessingService.name);
  private usageLog: AIUsageEntry[] = [];

  constructor(
    private readonly aiSettingsService: AISettingsService,
  ) {}

  async summarizeArticle(
    title: string,
    content: string,
    language: string = 'ne',
    articleId?: string,
  ): Promise<AISummaryResult> {
    const defaultProvider = await this.aiSettingsService.findDefault();
    if (!defaultProvider) {
      throw new BadRequestException('No default AI provider configured. Go to Admin > AI Models to set one up.');
    }

    const providerApiKey = await this.aiSettingsService.getDecryptedApiKey(defaultProvider.id);
    if (!providerApiKey) {
      throw new BadRequestException('AI provider API key not found');
    }

    const truncatedContent = content.substring(0, 4000);
    const prompt = this.buildPrompt(title, truncatedContent, language);

    // Estimate tokens (~4 chars per token for English, ~2 for Nepali)
    const inputChars = prompt.length;
    const estimatedInputTokens = Math.ceil(inputChars / 3);
    const estimatedOutputTokens = 500;
    const estimatedTokens = estimatedInputTokens + estimatedOutputTokens;

    // Get cost per 1k tokens for the model
    const models = this.aiSettingsService.getModelsForProvider(defaultProvider.provider);
    const modelInfo = models.find(m => m.id === defaultProvider.modelId);
    const costPer1k = modelInfo?.costPer1kTokens || 0.001;
    const estimatedCost = (estimatedTokens / 1000) * costPer1k;

    let result: { summary: string; keyPoints: string[]; category: string; credibilityScore: number };

    try {
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
        case 'groq':
          result = await this.callGroq(providerApiKey, defaultProvider.modelId, prompt);
          break;
        default:
          throw new BadRequestException(`Unsupported provider: ${defaultProvider.provider}`);
      }

      this.logUsage({
        timestamp: new Date(),
        provider: defaultProvider.provider,
        model: defaultProvider.modelId,
        articleId,
        estimatedTokens,
        estimatedCost,
        success: true,
      });

      return {
        ...result,
        provider: defaultProvider.provider,
        model: defaultProvider.modelId,
        estimatedTokens,
        estimatedCost,
      };
    } catch (error: any) {
      this.logUsage({
        timestamp: new Date(),
        provider: defaultProvider.provider,
        model: defaultProvider.modelId,
        articleId,
        estimatedTokens: 0,
        estimatedCost: 0,
        success: false,
      });
      throw error;
    }
  }

  getUsageStats(): {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    totalEstimatedCost: number;
    totalEstimatedTokens: number;
    byProvider: Record<string, { calls: number; cost: number; tokens: number }>;
    recentCalls: AIUsageEntry[];
  } {
    const successful = this.usageLog.filter(e => e.success);
    const byProvider: Record<string, { calls: number; cost: number; tokens: number }> = {};

    for (const entry of this.usageLog) {
      if (!byProvider[entry.provider]) {
        byProvider[entry.provider] = { calls: 0, cost: 0, tokens: 0 };
      }
      byProvider[entry.provider].calls++;
      byProvider[entry.provider].cost += entry.estimatedCost;
      byProvider[entry.provider].tokens += entry.estimatedTokens;
    }

    return {
      totalCalls: this.usageLog.length,
      successfulCalls: successful.length,
      failedCalls: this.usageLog.length - successful.length,
      totalEstimatedCost: successful.reduce((sum, e) => sum + e.estimatedCost, 0),
      totalEstimatedTokens: successful.reduce((sum, e) => sum + e.estimatedTokens, 0),
      byProvider,
      recentCalls: this.usageLog.slice(-20).reverse(),
    };
  }

  private logUsage(entry: AIUsageEntry) {
    this.usageLog.push(entry);
    // Keep last 1000 entries in memory
    if (this.usageLog.length > 1000) {
      this.usageLog = this.usageLog.slice(-1000);
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
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      },
      { timeout: 60000 },
    );
    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return this.parseAIResponse(text);
  }

  private async callAnthropic(apiKey: string, model: string, prompt: string) {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      { model, max_tokens: 1024, messages: [{ role: 'user', content: prompt }] },
      {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      },
    );
    const text = response.data.content?.[0]?.text || '';
    return this.parseAIResponse(text);
  }

  private async callOpenAI(apiKey: string, model: string, prompt: string) {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      { model, messages: [{ role: 'user', content: prompt }], max_tokens: 1024, temperature: 0.7 },
      {
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        timeout: 60000,
      },
    );
    const text = response.data.choices?.[0]?.message?.content || '';
    return this.parseAIResponse(text);
  }

  private async callGroq(apiKey: string, model: string, prompt: string) {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      { model, messages: [{ role: 'user', content: prompt }], max_tokens: 1024, temperature: 0.7 },
      {
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        timeout: 60000,
      },
    );
    const text = response.data.choices?.[0]?.message?.content || '';
    return this.parseAIResponse(text);
  }

  private parseAIResponse(text: string) {
    try {
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
    } catch (e) { }

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
      'opinion', 'general',
    ];
    const normalized = category.toLowerCase().trim();
    return validCategories.includes(normalized) ? normalized : 'general';
  }
}
