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
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
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

    let result: { summary: string; keyPoints: string[]; category: string; credibilityScore: number; seoTitle: string; seoDescription: string; seoKeywords: string[] };

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
    return `You are an expert SEO content analyst and news summarizer.

Analyze this news article and produce SEO-optimized metadata. Your output will be used for search engine indexing, social sharing, and AI/LLM discovery.

Tasks:
1. **summary**: Clear, informative summary (100-150 words) in ${langText}. Write it so both humans and AI models understand the key facts. Include who, what, when, where, why.
2. **keyPoints**: 3-5 key takeaways as complete sentences (not fragments). Each should be independently meaningful for AI citation.
3. **category**: Classify into ONE: Politics, Sports, Entertainment, Business, Technology, Health, Education, International, Opinion, General
4. **credibilityScore**: 1-10 based on source quality, factual claims, and attribution
5. **seoTitle**: An engaging, click-worthy headline (50-60 characters) in ${langText}. Include the primary topic and a relevant keyword. Do NOT just copy the original title.
6. **seoDescription**: Meta description (140-155 characters) in ${langText}. Summarize the article's value proposition. Include primary keyword naturally. Write it to maximize click-through from search results.
7. **seoKeywords**: 6-10 SEO keywords/phrases relevant to this article. Include a mix of:
   - Primary topic keywords (e.g., "Nepal politics", "cricket world cup")
   - Named entities (people, organizations, places mentioned)
   - Long-tail search phrases users might search for
   - Both ${langText} and English keywords if the article is in ${langText}

IMPORTANT: Respond in this exact JSON format:
{
  "summary": "your summary here",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "category": "category name",
  "credibilityScore": 7,
  "seoTitle": "optimized title here",
  "seoDescription": "meta description here",
  "seoKeywords": ["keyword1", "keyword2", "keyword3"]
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
        generationConfig: { temperature: 0.7, maxOutputTokens: 4096, responseMimeType: 'application/json' },
      },
      { timeout: 60000 },
    );

    // Check for safety blocks at the prompt level
    const blockReason = response.data.promptFeedback?.blockReason;
    if (blockReason) {
      throw new Error(`Gemini blocked the prompt: ${blockReason}`);
    }

    const candidate = response.data.candidates?.[0];
    if (!candidate) {
      throw new Error('Gemini returned no candidates');
    }

    const finishReason = candidate.finishReason;
    const text = candidate.content?.parts?.[0]?.text || '';

    if (!text) {
      throw new Error(`Gemini returned empty content (finishReason: ${finishReason ?? 'unknown'})`);
    }

    // MAX_TOKENS means the JSON was cut off mid-stream — parsing will fail, so surface it clearly
    if (finishReason === 'MAX_TOKENS') {
      this.logger.warn(`Gemini response truncated at MAX_TOKENS (${text.length} chars). Parsing may fail.`);
    } else if (finishReason && finishReason !== 'STOP') {
      this.logger.warn(`Gemini finishReason=${finishReason}, length=${text.length}`);
    }

    return this.parseAIResponse(text);
  }

  private async callAnthropic(apiKey: string, model: string, prompt: string) {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      { model, max_tokens: 4096, messages: [{ role: 'user', content: prompt }] },
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
      { model, messages: [{ role: 'user', content: prompt }], max_tokens: 4096, temperature: 0.7, response_format: { type: 'json_object' } },
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
      { model, messages: [{ role: 'user', content: prompt }], max_tokens: 4096, temperature: 0.7, response_format: { type: 'json_object' } },
      {
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        timeout: 60000,
      },
    );
    const text = response.data.choices?.[0]?.message?.content || '';
    return this.parseAIResponse(text);
  }

  private parseAIResponse(text: string) {
    if (!text) {
      throw new Error('AI returned empty response');
    }

    // Strip ```json ... ``` or ``` ... ``` markdown fences that models sometimes add
    let cleaned = text.trim();
    const fenceMatch = cleaned.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    if (fenceMatch) {
      cleaned = fenceMatch[1].trim();
    }

    // Extract the JSON object (first { to last })
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      this.logger.error(`AI response contained no JSON object. Preview: ${cleaned.substring(0, 200)}`);
      throw new Error('AI response did not contain a JSON object');
    }

    const jsonStr = cleaned.substring(firstBrace, lastBrace + 1);

    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (e: any) {
      this.logger.error(
        `Failed to parse AI JSON response: ${e.message}. Length=${jsonStr.length}. Preview: ${jsonStr.substring(0, 300)}`,
      );
      throw new Error(`AI response JSON parse failed: ${e.message}`);
    }

    const summary = typeof parsed.summary === 'string' ? parsed.summary.trim() : '';
    if (!summary || summary.length < 20) {
      this.logger.error(`AI response summary missing or too short (len=${summary.length})`);
      throw new Error('AI response summary missing or too short');
    }

    return {
      summary,
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
      category: this.normalizeCategory(parsed.category),
      credibilityScore: typeof parsed.credibilityScore === 'number' ? parsed.credibilityScore : 7,
      seoTitle: typeof parsed.seoTitle === 'string' ? parsed.seoTitle : '',
      seoDescription: typeof parsed.seoDescription === 'string' ? parsed.seoDescription : '',
      seoKeywords: Array.isArray(parsed.seoKeywords) ? parsed.seoKeywords : [],
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
