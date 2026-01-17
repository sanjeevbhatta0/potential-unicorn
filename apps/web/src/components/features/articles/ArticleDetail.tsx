'use client';

import Image from 'next/image';
import { Article } from '@potential-unicorn/types';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useArticleStore } from '@/lib/store/articleStore';
import { useEffect, useState } from 'react';
import { useIncrementViewCount } from '@/lib/hooks/useArticles';
import { cn } from '@/lib/utils/cn';

interface ArticleDetailProps {
  article: Article;
}

interface AISummaryData {
  summary: string;
  key_points: string[];
}

// Helper to get credibility score styling
const getCredibilityStyle = (score: number) => {
  if (score >= 7) return { class: 'credibility-high', label: 'High Credibility', color: 'text-emerald-600' };
  if (score >= 4) return { class: 'credibility-medium', label: 'Medium Credibility', color: 'text-amber-600' };
  return { class: 'credibility-low', label: 'Low Credibility', color: 'text-red-600' };
};

// Get credibility score
const getCredibilityScore = (article: Article) => {
  const articleData = article as any;
  if (articleData.credibilityScore && typeof articleData.credibilityScore === 'number') {
    return articleData.credibilityScore;
  }
  const hash = article.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return Math.min(10, Math.max(1, (hash % 10) + 1));
};

// Get source name from sourceId
const getSourceInfo = (sourceId: string) => {
  const sources: Record<string, { name: string; url: string }> = {
    '550e8400-e29b-41d4-a716-446655440001': { name: 'Online Khabar', url: 'https://onlinekhabar.com' },
    '550e8400-e29b-41d4-a716-446655440002': { name: 'eKantipur', url: 'https://ekantipur.com' },
    '550e8400-e29b-41d4-a716-446655440003': { name: 'Setopati', url: 'https://setopati.com' },
  };
  return sources[sourceId] || { name: 'News Source', url: '#' };
};

const DEFAULT_KEY_POINTS = [
  'Analyzing key facts from this article...',
  'Cross-referencing with multiple sources...',
  'Adding contextual information...',
];

export function ArticleDetail({ article }: ArticleDetailProps) {
  const { isBookmarked, toggleBookmark } = useArticleStore();
  const incrementViewCount = useIncrementViewCount();
  const bookmarked = isBookmarked(article.id);

  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [summaryData, setSummaryData] = useState<AISummaryData>({
    summary: '',
    key_points: [],
  });
  const [currentCategory, setCurrentCategory] = useState(article.category);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const credibilityScore = getCredibilityScore(article);
  const credibilityStyle = getCredibilityStyle(credibilityScore);
  const sourceInfo = getSourceInfo(article.sourceId);

  useEffect(() => {
    incrementViewCount.mutate(article.id);
    setCurrentCategory(article.category);

    const loadAISummary = async () => {
      const articleData = article as any;
      if (articleData.aiSummary) {
        setSummaryData({
          summary: articleData.aiSummary,
          key_points: articleData.aiKeyPoints || [],
        });
        setIsLoadingSummary(false);
        return;
      }

      setIsLoadingSummary(true);
      setSummaryError(null);

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api/v1';
        const response = await fetch(`${apiUrl}/articles/${article.id}/process-ai`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error('AI service temporarily unavailable');
        }

        const data = await response.json();
        setSummaryData({
          summary: data.aiSummary || 'Summary not available',
          key_points: data.aiKeyPoints || [],
        });

        if (data.category && data.category !== currentCategory) {
          setCurrentCategory(data.category);
        }

      } catch (err) {
        console.error('AI summary error:', err);
        setSummaryError(err instanceof Error ? err.message : 'Failed to load summary');
        setSummaryData({
          summary: article.summary || 'Could not load AI summary. Please visit the original article.',
          key_points: DEFAULT_KEY_POINTS,
        });
      } finally {
        setIsLoadingSummary(false);
      }
    };

    loadAISummary();
  }, [article.id]);

  return (
    <article className="max-w-4xl mx-auto px-4">
      {/* Header Meta */}
      <header className="py-8 border-b border-border">
        <div className="flex items-center gap-4 mb-6 text-sm">
          <span className="font-bold uppercase tracking-widest text-primary">
            {currentCategory}
          </span>
          <span className="text-muted-foreground">|</span>
          <span className="text-muted-foreground">{sourceInfo.name}</span>
          <span className="text-muted-foreground">|</span>
          <span className={cn('ai-score-badge', credibilityStyle.class)}>
            AI Score: {credibilityScore}/10
          </span>
        </div>

        <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6 leading-tight">
          {article.title}
        </h1>

        <div className="flex items-center justify-between flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            {article.author && (
              <span>By <span className="font-semibold text-foreground">{article.author}</span></span>
            )}
            <span>{format(new Date(article.publishedAt), 'MMMM dd, yyyy')}</span>
            <span>{article.viewCount} views</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleBookmark(article.id)}
          >
            {bookmarked ? 'Bookmarked' : 'Bookmark'}
          </Button>
        </div>
      </header>

      {/* Featured Image */}
      {article.imageUrl && (
        <div className="relative w-full h-96 my-8 bg-gray-100">
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* AI Summary */}
      <div className="max-w-[660px] mx-auto">
        <div className="mb-8 py-6 border-t border-b border-border">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="font-serif text-xl font-bold">AI Summary</h2>
            {isLoadingSummary && (
              <span className="text-xs text-muted-foreground animate-pulse">
                Loading...
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            This is an AI-generated summary. For full content, please visit the original source.
          </p>
          <p className={cn('text-lg leading-relaxed', isLoadingSummary && 'animate-pulse text-muted-foreground')}>
            {isLoadingSummary
              ? 'Preparing AI summary...'
              : summaryData.summary || article.summary || 'Summary not available.'
            }
          </p>
          {summaryError && (
            <p className="mt-3 text-sm text-amber-600">
              {summaryError}
            </p>
          )}
        </div>

        {/* Key Points */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="font-serif text-xl font-bold">Key Points</h2>
            {isLoadingSummary && (
              <span className="text-xs text-muted-foreground animate-pulse">Loading...</span>
            )}
          </div>
          <ul className="space-y-3">
            {(summaryData.key_points.length > 0 ? summaryData.key_points : DEFAULT_KEY_POINTS).map((point: string, index: number) => (
              <li key={index} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-white flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </span>
                <span className={cn('flex-1 leading-relaxed', isLoadingSummary ? 'text-muted-foreground animate-pulse' : 'text-foreground')}>
                  {point}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Read Original CTA */}
        <div className="mb-8 py-8 border-t border-b border-border text-center">
          <h3 className="font-serif text-2xl font-bold mb-3">Read the Full Article</h3>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Visit the original source for the complete story, quotes, and multimedia content.
          </p>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
          >
            Read on {sourceInfo.name}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Related Topics</h3>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 text-sm border border-border hover:border-primary hover:text-primary transition-colors cursor-pointer"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="py-8 border-t border-border">
          <div className="flex items-center justify-between flex-wrap gap-4 text-sm">
            <div className="text-muted-foreground">
              <span className="font-medium">Source:</span> {sourceInfo.name} |
              Published {format(new Date(article.publishedAt), 'MMMM dd, yyyy')}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Share
              </Button>
              <Button variant="outline" size="sm">
                Report
              </Button>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 text-sm text-muted-foreground text-center">
            <p>
              This summary was generated by AI. The original content belongs to <strong>{sourceInfo.name}</strong>.
            </p>
          </div>
        </footer>
      </div>
    </article>
  );
}
