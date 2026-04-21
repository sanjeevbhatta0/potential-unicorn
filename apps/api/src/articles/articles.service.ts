import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like, Between, Not, In, IsNull } from 'typeorm';
import { ArticleEntity } from '../database/entities/article.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticleDto } from './dto/query-article.dto';
import { PaginatedResponse } from '@potential-unicorn/types';
import { AppSettingsService } from '../app-settings/app-settings.service';
import { AIProcessingService } from '../ai-settings/ai-processing.service';

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
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly appSettingsService: AppSettingsService,
    private readonly aiProcessingService: AIProcessingService,
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

    // Check if balanced feed should be used (page 1, no specific filters)
    const isBalancedEligible = page === 1 && !category && !sourceId && !search && !isTrending;
    const isBalancedEnabled = await this.appSettingsService.isBalancedFeedEnabled();

    const cacheKey = `articles_list_${JSON.stringify(query)}_balanced_${isBalancedEnabled}`;

    // Check cache
    const cached = await this.cacheManager.get<PaginatedResponse<ArticleEntity>>(cacheKey);
    if (cached) {
      return cached;
    }

    let data: ArticleEntity[];
    let total: number;

    if (isBalancedEligible && isBalancedEnabled) {
      // Use balanced feed algorithm
      const balancedResult = await this.findAllBalanced(limit, includeTests);
      data = balancedResult.articles;
      total = balancedResult.total;
    } else {
      // Standard query
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

      [data, total] = await this.articleRepository.findAndCount({
        where,
        relations: ['source'],
        order: { [sortBy]: sortOrder.toUpperCase() },
        skip: (page - 1) * limit,
        take: limit,
      });
    }

    const totalPages = Math.ceil(total / limit);

    const result = {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
      },
    };

    // Set cache (5 minutes)
    await this.cacheManager.set(cacheKey, result, 300000);

    return result;
  }

  /**
   * Fetch articles with balanced representation from all sources
   */
  private async findAllBalanced(
    limit: number,
    includeTests: boolean,
  ): Promise<{ articles: ArticleEntity[]; total: number }> {
    // Get all distinct source IDs that have articles
    const sourceIds = await this.articleRepository
      .createQueryBuilder('article')
      .select('DISTINCT article.sourceId', 'sourceId')
      .getRawMany();

    const numSources = sourceIds.length;
    if (numSources === 0) {
      return { articles: [], total: 0 };
    }

    // Calculate articles per source (ensure at least 1 per source)
    const articlesPerSource = Math.max(1, Math.ceil(limit / numSources));

    // Fetch articles from each source
    const allArticles: ArticleEntity[] = [];

    for (const { sourceId } of sourceIds) {
      const whereCondition: FindOptionsWhere<ArticleEntity> = { sourceId };

      if (!includeTests) {
        whereCondition.title = Not(Like('Integration Test Article%'));
      }

      const sourceArticles = await this.articleRepository.find({
        where: whereCondition,
        relations: ['source'],
        order: { publishedAt: 'DESC' },
        take: articlesPerSource,
      });

      allArticles.push(...sourceArticles);
    }

    // Sort all articles by publishedAt and take the top `limit`
    allArticles.sort((a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    // Get total count for pagination
    const total = await this.articleRepository.count({
      where: includeTests ? {} : { title: Not(Like('Integration Test Article%')) },
    });

    return {
      articles: allArticles.slice(0, limit),
      total,
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
    const cacheKey = `articles_trending_${limit}`;
    const cached = await this.cacheManager.get<ArticleEntity[]>(cacheKey);
    if (cached) return cached;

    const result = await this.articleRepository.find({
      where: { isTrending: true },
      relations: ['source'],
      order: { viewCount: 'DESC' },
      take: limit,
    }); // Fixed missing paren/brace in original view if any, ensuring correct closure

    await this.cacheManager.set(cacheKey, result, 300000);
    return result;
  }

  async findByCategory(
    category: string,
    limit: number = 10,
  ): Promise<ArticleEntity[]> {
    const cacheKey = `articles_category_${category}_${limit}`;
    const cached = await this.cacheManager.get<ArticleEntity[]>(cacheKey);
    if (cached) return cached;

    const result = await this.articleRepository.find({
      where: { category: category as any },
      relations: ['source'],
      order: { publishedAt: 'DESC' },
      take: limit,
    });

    await this.cacheManager.set(cacheKey, result, 300000);
    return result;
  }

  /**
   * Process an article with AI (on-demand for existing articles)
   * If already processed, returns cached data from DB
   * Otherwise, calls the configured AI provider directly
   */
  /**
   * A summary is considered "healthy" (safe to serve from cache) only if it's
   * reasonably long AND the article has a non-empty seoTitle, which indicates
   * the structured JSON was parsed successfully on the previous run.
   * Without this check, any previously-saved garbage/empty summary would be
   * served forever because of the truthy-check cache short-circuit.
   */
  private isAiSummaryHealthy(article: ArticleEntity): boolean {
    const summary = article.aiSummary?.trim() || '';
    const seoTitle = article.seoTitle?.trim() || '';
    return summary.length >= 50 && seoTitle.length > 0;
  }

  async processArticleWithAI(id: string, force: boolean = false): Promise<{
    aiSummary: string;
    aiKeyPoints: string[];
    credibilityScore: number;
    category?: string;
  }> {
    const article = await this.findOne(id);

    // If already processed with a healthy result, return cached data
    if (!force && this.isAiSummaryHealthy(article)) {
      return {
        aiSummary: article.aiSummary,
        aiKeyPoints: article.aiKeyPoints || [],
        credibilityScore: article.credibilityScore || 7,
        category: article.category,
      };
    }

    try {
      const result = await this.aiProcessingService.summarizeArticle(
        article.title,
        article.content?.substring(0, 4000) || article.title,
        article.language || 'ne',
        article.id,
      );

      // Update article with AI results including SEO fields
      article.aiSummary = result.summary;
      article.aiKeyPoints = result.keyPoints;
      article.credibilityScore = result.credibilityScore;
      article.seoTitle = result.seoTitle || '';
      article.seoDescription = result.seoDescription || '';
      article.seoKeywords = result.seoKeywords || [];
      // Merge SEO keywords into tags for better discoverability
      if (result.seoKeywords?.length) {
        const existingTags = article.tags || [];
        const merged = [...new Set([...existingTags, ...result.seoKeywords])];
        article.tags = merged.slice(0, 15);
      }
      if (result.category && result.category !== 'general') {
        article.category = result.category as any;
      }
      await this.articleRepository.save(article);

      return {
        aiSummary: result.summary,
        aiKeyPoints: result.keyPoints,
        credibilityScore: result.credibilityScore,
        category: article.category,
      };
    } catch (error: any) {
      console.error('AI processing failed:', error.message);
      throw new BadRequestException(error.message || 'Failed to process article with AI');
    }
  }

  /**
   * Batch re-process articles that are missing SEO fields.
   * Clears existing aiSummary to force re-generation with new SEO-enhanced prompt.
   */
  async reprocessArticlesForSeo(limit: number = 20): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
    results: Array<{ id: string; title: string; status: string }>;
  }> {
    // Find articles missing seoTitle (i.e., not yet processed with the new prompt)
    const articles = await this.articleRepository.find({
      where: [
        { seoTitle: IsNull() },
        { seoTitle: '' },
      ],
      order: { publishedAt: 'DESC' },
      take: limit,
    });

    const results: Array<{ id: string; title: string; status: string }> = [];
    let succeeded = 0;
    let failed = 0;

    for (const article of articles) {
      try {
        // Clear aiSummary to force re-processing
        article.aiSummary = null as any;
        await this.articleRepository.save(article);

        // Re-process with AI (which now generates SEO fields)
        await this.processArticleWithAI(article.id);
        succeeded++;
        results.push({ id: article.id, title: article.title.substring(0, 60), status: 'ok' });
      } catch (error: any) {
        failed++;
        results.push({ id: article.id, title: article.title.substring(0, 60), status: error.message });
      }
    }

    return { processed: articles.length, succeeded, failed, results };
  }

  /**
   * Batch re-process articles with broken AI summaries.
   * Finds articles where aiSummary is missing, too short, or where seoTitle is
   * empty (indicating the previous parse failed and saved garbage). Forces
   * regeneration on each.
   */
  async reprocessBrokenSummaries(limit: number = 50): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
    results: Array<{ id: string; title: string; status: string }>;
  }> {
    // Candidates: no summary, very short summary, or summary without seoTitle
    // (seoTitle empty is the strongest signal that parsing failed previously).
    const candidates = await this.articleRepository
      .createQueryBuilder('a')
      .where('a.ai_summary IS NULL')
      .orWhere('LENGTH(a.ai_summary) < 50')
      .orWhere('a.seo_title IS NULL')
      .orWhere("a.seo_title = ''")
      .orderBy('a.published_at', 'DESC')
      .take(limit)
      .getMany();

    const results: Array<{ id: string; title: string; status: string }> = [];
    let succeeded = 0;
    let failed = 0;

    for (const article of candidates) {
      try {
        await this.processArticleWithAI(article.id, true);
        succeeded++;
        results.push({ id: article.id, title: article.title.substring(0, 60), status: 'ok' });
      } catch (error: any) {
        failed++;
        results.push({
          id: article.id,
          title: article.title.substring(0, 60),
          status: error.message || 'unknown error',
        });
      }
    }

    return { processed: candidates.length, succeeded, failed, results };
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

