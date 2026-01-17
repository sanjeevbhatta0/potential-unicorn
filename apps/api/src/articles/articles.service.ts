import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like, Between } from 'typeorm';
import { ArticleEntity } from '../database/entities/article.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticleDto } from './dto/query-article.dto';
import { PaginatedResponse } from '@potential-unicorn/types';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly articleRepository: Repository<ArticleEntity>,
  ) { }

  async create(createArticleDto: CreateArticleDto): Promise<ArticleEntity> {
    const article = this.articleRepository.create({
      ...createArticleDto,
      summary: createArticleDto.aiSummary || '', // Use AI summary if provided
      highlights: [],
      tags: createArticleDto.tags || [],
      viewCount: 0,
      isTrending: false,
      // AI fields (will be null for existing articles, populated for new)
      aiSummary: createArticleDto.aiSummary,
      aiKeyPoints: createArticleDto.aiKeyPoints,
      credibilityScore: createArticleDto.credibilityScore,
    });

    return this.articleRepository.save(article);
  }

  async findAll(
    query: QueryArticleDto,
  ): Promise<PaginatedResponse<ArticleEntity>> {
    const {
      category,
      language,
      sourceId,
      isTrending,
      dateFrom,
      dateTo,
      search,
      page = 1,
      limit = 10,
      sortBy = 'publishedAt',
      sortOrder = 'desc',
    } = query;

    const where: FindOptionsWhere<ArticleEntity> = {};

    if (category) where.category = category;
    if (language) where.language = language;
    if (sourceId) where.sourceId = sourceId;
    if (isTrending !== undefined) where.isTrending = isTrending;

    // Date range filter
    if (dateFrom && dateTo) {
      where.publishedAt = Between(new Date(dateFrom), new Date(dateTo));
    }

    // Search filter
    if (search) {
      // Note: This is a simple implementation. For production, consider using full-text search
      where.title = Like(`%${search}%`);
    }

    const [data, total] = await this.articleRepository.findAndCount({
      where,
      relations: ['source'],
      order: { [sortBy]: sortOrder.toUpperCase() },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  }

  async findOne(id: string): Promise<ArticleEntity> {
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: ['source'],
    });

    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }

    return article;
  }

  async update(
    id: string,
    updateArticleDto: UpdateArticleDto,
  ): Promise<ArticleEntity> {
    const article = await this.findOne(id);

    Object.assign(article, updateArticleDto);

    return this.articleRepository.save(article);
  }

  async remove(id: string): Promise<void> {
    const article = await this.findOne(id);
    await this.articleRepository.remove(article);
  }

  async incrementViewCount(id: string): Promise<ArticleEntity> {
    const article = await this.findOne(id);
    article.viewCount += 1;
    return this.articleRepository.save(article);
  }

  async findTrending(limit: number = 10): Promise<ArticleEntity[]> {
    return this.articleRepository.find({
      where: { isTrending: true },
      relations: ['source'],
      order: { viewCount: 'DESC' },
      take: limit,
    });
  }

  async findByCategory(
    category: string,
    limit: number = 10,
  ): Promise<ArticleEntity[]> {
    return this.articleRepository.find({
      where: { category: category as any },
      relations: ['source'],
      order: { publishedAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Process an article with AI (on-demand for existing articles)
   * If already processed, returns cached data from DB
   * Otherwise, calls AI service to generate summary and credibility score
   */
  async processArticleWithAI(id: string): Promise<{
    aiSummary: string;
    aiKeyPoints: string[];
    credibilityScore: number;
    category?: string;
  }> {
    const article = await this.findOne(id);

    // If already processed, return cached data
    if (article.aiSummary) {
      return {
        aiSummary: article.aiSummary,
        aiKeyPoints: article.aiKeyPoints || [],
        credibilityScore: article.credibilityScore || 7,
        category: article.category,
      };
    }

    // Call AI service to process article
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

    try {
      // Call summarize endpoint
      const summaryResponse = await fetch(`${aiServiceUrl}/api/v1/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article: {
            content: article.content?.substring(0, 4000) || article.title,
            title: article.title,
          },
          provider: 'claude',
          length: 'medium',
          language: 'ne', // Nepali
        }),
      });

      if (!summaryResponse.ok) {
        throw new Error(`AI service error: ${summaryResponse.status}`);
      }

      const summaryData = await summaryResponse.json();

      // Call credibility endpoint
      const credibilityResponse = await fetch(`${aiServiceUrl}/api/v1/credibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article: {
            content: article.content?.substring(0, 4000) || article.title,
            title: article.title,
            url: article.url,
          },
        }),
      });

      let credibilityScore = 7; // Default score
      if (credibilityResponse.ok) {
        const credibilityData = await credibilityResponse.json();
        credibilityScore = credibilityData.overall_score || 7;
      }

      // Extract key points from summary response
      const keyPoints = summaryData.key_points || [];

      // Update category if provided
      if (summaryData.category) {
        const aiCategory = summaryData.category.toLowerCase();
        // Valid categories map
        const categoryMap: Record<string, any> = {
          'politics': 'politics',
          'sports': 'sports',
          'entertainment': 'entertainment',
          'business': 'business',
          'technology': 'technology',
          'health': 'health',
          'education': 'education',
          'international': 'international',
          'opinion': 'opinion',
          'general': 'general'
        };

        if (categoryMap[aiCategory]) {
          article.category = categoryMap[aiCategory];
        }
      }

      // Save to database
      article.aiSummary = summaryData.summary;
      article.aiKeyPoints = keyPoints;
      article.credibilityScore = credibilityScore;
      await this.articleRepository.save(article);

      return {
        aiSummary: summaryData.summary,
        aiKeyPoints: keyPoints,
        credibilityScore,
        category: article.category,
      };
    } catch (error) {
      console.error('AI processing failed:', error);
      throw new BadRequestException('Failed to process article with AI');
    }
  }
}

