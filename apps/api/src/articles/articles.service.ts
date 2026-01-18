import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like, Between, Not } from 'typeorm';
import { ArticleEntity } from '../database/entities/article.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticleDto } from './dto/query-article.dto';
import { PaginatedResponse } from '@potential-unicorn/types';

// Keyword mappings for category detection (supports both English and Nepali)
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'politics': [
    'government', 'minister', 'parliament', 'election', 'vote', 'party', 'political',
    'president', 'prime minister', 'congress', 'legislation', 'policy', 'diplomat',
    'सरकार', 'मन्त्री', 'संसद', 'चुनाव', 'मतदान', 'पार्टी', 'राजनीतिक', 'प्रधानमन्त्री',
    'नेता', 'दल', 'निर्वाचन', 'राष्ट्रपति', 'कांग्रेस', 'एमाले', 'माओवादी'
  ],
  'sports': [
    'football', 'cricket', 'match', 'game', 'player', 'team', 'score', 'goal',
    'tournament', 'championship', 'league', 'athlete', 'coach', 'stadium', 'win', 'loss',
    'खेल', 'फुटबल', 'क्रिकेट', 'खेलाडी', 'टिम', 'गोल', 'प्रतियोगिता', 'च्याम्पियनशिप'
  ],
  'entertainment': [
    'movie', 'film', 'actor', 'actress', 'music', 'song', 'concert', 'celebrity',
    'bollywood', 'hollywood', 'tv', 'show', 'drama', 'series', 'singer', 'dance',
    'फिल्म', 'चलचित्र', 'गायक', 'गायिका', 'नायक', 'नायिका', 'गीत', 'संगीत', 'नाटक'
  ],
  'business': [
    'economy', 'market', 'stock', 'company', 'business', 'trade', 'investment',
    'finance', 'bank', 'price', 'profit', 'loss', 'industry', 'entrepreneur',
    'अर्थतन्त्र', 'बजार', 'व्यापार', 'कम्पनी', 'बैंक', 'लगानी', 'आर्थिक', 'मूल्य'
  ],
  'technology': [
    'technology', 'tech', 'software', 'app', 'digital', 'internet', 'computer',
    'ai', 'artificial intelligence', 'mobile', 'startup', 'innovation', 'cyber',
    'प्रविधि', 'टेक्नोलोजी', 'सफ्टवेयर', 'इन्टरनेट', 'डिजिटल', 'मोबाइल', 'एप'
  ],
  'health': [
    'health', 'hospital', 'doctor', 'medical', 'disease', 'treatment', 'patient',
    'medicine', 'vaccine', 'covid', 'virus', 'wellness', 'healthcare',
    'स्वास्थ्य', 'अस्पताल', 'डाक्टर', 'रोग', 'उपचार', 'बिरामी', 'औषधि', 'भ्याक्सिन'
  ],
  'education': [
    'education', 'school', 'university', 'college', 'student', 'teacher', 'exam',
    'learning', 'academic', 'degree', 'scholarship', 'curriculum',
    'शिक्षा', 'विद्यालय', 'विश्वविद्यालय', 'विद्यार्थी', 'शिक्षक', 'परीक्षा'
  ],
  'international': [
    'international', 'world', 'global', 'foreign', 'united nations', 'diplomacy',
    'usa', 'china', 'india', 'europe', 'america', 'asia', 'war', 'conflict',
    'अन्तर्राष्ट्रिय', 'विश्व', 'विदेश', 'भारत', 'चीन', 'अमेरिका', 'युरोप'
  ],
  'opinion': [
    'opinion', 'editorial', 'column', 'analysis', 'perspective', 'commentary',
    'view', 'thought', 'विचार', 'सम्पादकीय', 'विश्लेषण', 'टिप्पणी'
  ],
};

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
      includeTests = false,
    } = query;

    const where: FindOptionsWhere<ArticleEntity> = {};

    if (category) where.category = category;
    if (language) where.language = language;
    if (sourceId) where.sourceId = sourceId;
    if (isTrending !== undefined) where.isTrending = isTrending;

    if (dateFrom && dateTo) {
      where.publishedAt = Between(new Date(dateFrom), new Date(dateTo));
    }

    if (search) {
      where.title = Like(`%${search}%`);
    }

    // Exclude test articles unless explicitly requested
    if (!includeTests && !search) {
      where.title = Not(Like('Integration Test Article%'));
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

  /**
   * Detect category from article title and content using keyword matching
   */
  private detectCategoryFromKeywords(title: string, content: string): string {
    const text = `${title} ${content}`.toLowerCase();

    const categoryScores: Record<string, number> = {};
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      const score = keywords.filter(keyword => text.includes(keyword.toLowerCase())).length;
      if (score > 0) {
        categoryScores[category] = score;
      }
    }

    if (Object.keys(categoryScores).length > 0) {
      // Return category with highest score
      const bestCategory = Object.entries(categoryScores).reduce((a, b) =>
        a[1] > b[1] ? a : b
      )[0];
      return bestCategory;
    }

    return 'general';
  }

  /**
   * Re-categorize a single article using keyword detection
   */
  async recategorizeArticle(id: string): Promise<{ id: string; oldCategory: string; newCategory: string }> {
    const article = await this.findOne(id);
    const oldCategory = article.category;

    const newCategory = this.detectCategoryFromKeywords(
      article.title,
      article.content || ''
    );

    if (newCategory !== oldCategory) {
      article.category = newCategory as any;
      await this.articleRepository.save(article);
    }

    return {
      id: article.id,
      oldCategory,
      newCategory,
    };
  }

  /**
   * Re-categorize all articles marked as "general"
   */
  async recategorizeGeneralArticles(limit: number = 50): Promise<{
    processed: number;
    recategorized: number;
    results: Array<{ id: string; title: string; oldCategory: string; newCategory: string }>;
  }> {
    // Find articles with "general" category
    const articles = await this.articleRepository.find({
      where: { category: 'general' as any },
      take: limit,
      order: { publishedAt: 'DESC' },
    });

    const results: Array<{ id: string; title: string; oldCategory: string; newCategory: string }> = [];
    let recategorized = 0;

    for (const article of articles) {
      const newCategory = this.detectCategoryFromKeywords(
        article.title,
        article.content || ''
      );

      if (newCategory !== 'general') {
        article.category = newCategory as any;
        await this.articleRepository.save(article);
        recategorized++;
      }

      results.push({
        id: article.id,
        title: article.title.substring(0, 50) + '...',
        oldCategory: 'general',
        newCategory,
      });
    }

    return {
      processed: articles.length,
      recategorized,
      results,
    };
  }
}

