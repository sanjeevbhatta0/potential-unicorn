import { Article } from '../crawlers/base.crawler';
import logger from '../utils/logger';

export interface ProcessedArticle extends Article {
  wordCount: number;
  readingTime: number; // in minutes
  language: 'ne' | 'en' | 'mixed';
  summary?: string;
  sourceId?: string; // Optional: provided by GenericCrawler for dynamic sources
}

export class ArticleProcessor {
  /**
   * Clean text by removing extra whitespace, special characters, etc.
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newline
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
      .trim();
  }

  /**
   * Detect language (Nepali, English, or mixed)
   */
  private detectLanguage(text: string): 'ne' | 'en' | 'mixed' {
    // Devanagari script range for Nepali
    const nepaliChars = (text.match(/[\u0900-\u097F]/g) || []).length;
    const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
    const total = nepaliChars + englishChars;

    if (total === 0) return 'en'; // Default to English if no chars detected

    const nepaliPercentage = (nepaliChars / total) * 100;

    if (nepaliPercentage > 70) return 'ne';
    if (nepaliPercentage < 30) return 'en';
    return 'mixed';
  }

  /**
   * Count words in text (handles both English and Nepali)
   */
  private countWords(text: string): number {
    // Remove extra whitespace
    const cleaned = text.trim().replace(/\s+/g, ' ');

    // For Nepali text, count characters divided by average word length
    // For English, count space-separated words
    const nepaliChars = (cleaned.match(/[\u0900-\u097F]/g) || []).length;
    const englishWords = cleaned.split(/\s+/).filter(word => /[a-zA-Z]/.test(word)).length;

    // Average Nepali word length is about 5 characters
    const estimatedNepaliWords = Math.floor(nepaliChars / 5);

    return englishWords + estimatedNepaliWords;
  }

  /**
   * Calculate reading time in minutes
   */
  private calculateReadingTime(wordCount: number): number {
    // Average reading speed: 200 words per minute for English, 150 for Nepali
    const wordsPerMinute = 175; // Average between the two
    return Math.ceil(wordCount / wordsPerMinute);
  }

  /**
   * Generate a summary from content (first 2-3 sentences)
   */
  private generateSummary(content: string, maxLength: number = 200): string {
    const sentences = content.match(/[^।.!?]+[।.!?]+/g) || [];

    let summary = '';
    for (const sentence of sentences) {
      if (summary.length + sentence.length <= maxLength) {
        summary += sentence;
      } else {
        break;
      }

      // Stop after 2-3 sentences
      if (summary.split(/[।.!?]/).length >= 3) {
        break;
      }
    }

    return summary.trim() || content.substring(0, maxLength) + '...';
  }

  /**
   * Validate article data
   */
  private validateArticle(article: Article): boolean {
    // Check required fields
    if (!article.url || !article.title || !article.content) {
      logger.warn(`Invalid article: Missing required fields`);
      return false;
    }

    // Check minimum content length (at least 100 characters)
    if (article.content.length < 100) {
      logger.warn(`Invalid article: Content too short (${article.content.length} chars)`);
      return false;
    }

    // Check title length (should be reasonable)
    if (article.title.length < 10 || article.title.length > 300) {
      logger.warn(`Invalid article: Title length unusual (${article.title.length} chars)`);
      return false;
    }

    return true;
  }

  /**
   * Clean and normalize article data
   */
  private cleanArticle(article: Article): Article {
    return {
      ...article,
      title: this.cleanText(article.title),
      content: this.cleanText(article.content),
      author: article.author ? this.cleanText(article.author) : undefined,
      category: article.category ? this.cleanText(article.category) : undefined,
      tags: article.tags?.map(tag => this.cleanText(tag)).filter(tag => tag.length > 0),
    };
  }

  /**
   * Process a single article
   */
  processArticle(article: Article): ProcessedArticle | null {
    try {
      // Validate article
      if (!this.validateArticle(article)) {
        return null;
      }

      // Clean article data
      const cleanedArticle = this.cleanArticle(article);

      // Calculate metrics
      const wordCount = this.countWords(cleanedArticle.content);
      const readingTime = this.calculateReadingTime(wordCount);
      const language = this.detectLanguage(cleanedArticle.content);
      const summary = this.generateSummary(cleanedArticle.content);

      const processedArticle: ProcessedArticle = {
        ...cleanedArticle,
        wordCount,
        readingTime,
        language,
        summary,
      };

      logger.debug(`Processed article: ${processedArticle.title} (${wordCount} words, ${readingTime}min read)`);

      return processedArticle;
    } catch (error: any) {
      logger.error(`Error processing article ${article.url}: ${error.message}`);
      return null;
    }
  }

  /**
   * Process multiple articles
   */
  processArticles(articles: Article[]): ProcessedArticle[] {
    logger.info(`Processing ${articles.length} articles`);

    const processedArticles: ProcessedArticle[] = [];

    for (const article of articles) {
      const processed = this.processArticle(article);
      if (processed) {
        processedArticles.push(processed);
      }
    }

    logger.info(`Successfully processed ${processedArticles.length}/${articles.length} articles`);

    return processedArticles;
  }

  /**
   * Filter articles by criteria
   */
  filterArticles(
    articles: ProcessedArticle[],
    criteria: {
      minWordCount?: number;
      maxWordCount?: number;
      language?: 'ne' | 'en' | 'mixed';
      categories?: string[];
      excludeCategories?: string[];
    }
  ): ProcessedArticle[] {
    return articles.filter(article => {
      // Filter by word count
      if (criteria.minWordCount && article.wordCount < criteria.minWordCount) {
        return false;
      }
      if (criteria.maxWordCount && article.wordCount > criteria.maxWordCount) {
        return false;
      }

      // Filter by language
      if (criteria.language && article.language !== criteria.language) {
        return false;
      }

      // Filter by category
      if (criteria.categories && criteria.categories.length > 0) {
        if (!article.category || !criteria.categories.includes(article.category)) {
          return false;
        }
      }

      // Exclude categories
      if (criteria.excludeCategories && criteria.excludeCategories.length > 0) {
        if (article.category && criteria.excludeCategories.includes(article.category)) {
          return false;
        }
      }

      return true;
    });
  }
}

export default new ArticleProcessor();
