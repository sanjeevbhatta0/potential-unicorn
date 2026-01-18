'use client';

import Image from 'next/image';
import { Article } from '@potential-unicorn/types';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useArticleStore } from '@/lib/store/articleStore';
import { useEffect, useState, useCallback } from 'react';
import { useIncrementViewCount } from '@/lib/hooks/useArticles';
import { cn } from '@/lib/utils/cn';

interface ArticleDetailProps {
  article: Article;
}

interface AISummaryData {
  summary: string;
  key_points: string[];
}

// Helper to get credibility score styling (5-point scale)
const getCredibilityStyle = (score: number) => {
  if (score >= 3.5) return { class: 'credibility-high', label: 'High Credibility', color: 'text-emerald-600' };
  if (score >= 2) return { class: 'credibility-medium', label: 'Medium Credibility', color: 'text-amber-600' };
  return { class: 'credibility-low', label: 'Low Credibility', color: 'text-red-600' };
};

// Convert 10-point score to 5-point scale
const convertTo5PointScale = (score: number): number => {
  return Math.round((score / 2) * 10) / 10;
};

// Get initial credibility score from article (converted to 5-point scale)
const getInitialCredibilityScore = (article: Article): number | null => {
  const articleData = article as any;
  if (articleData.credibilityScore && typeof articleData.credibilityScore === 'number') {
    return convertTo5PointScale(articleData.credibilityScore);
  }
  return null;
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

// Progress Bar Component
function AILoadingProgress({ progress, stage }: { progress: number; stage: string }) {
  return (
    <div className="my-8 p-6 border border-border bg-card rounded-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <svg className="w-5 h-5 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Generating AI Summary</h3>
          <p className="text-sm text-muted-foreground">{stage}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <span>Processing article...</span>
        <span>{progress}%</span>
      </div>
    </div>
  );
}

export function ArticleDetail({ article }: ArticleDetailProps) {
  const { isBookmarked, toggleBookmark } = useArticleStore();
  const incrementViewCount = useIncrementViewCount();
  const bookmarked = isBookmarked(article.id);

  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState('Initializing AI...');
  const [summaryData, setSummaryData] = useState<AISummaryData>({
    summary: '',
    key_points: [],
  });
  const [currentCategory, setCurrentCategory] = useState(article.category);
  const [credibilityScore, setCredibilityScore] = useState<number | null>(getInitialCredibilityScore(article));
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [hasAIData, setHasAIData] = useState(false);

  const credibilityStyle = credibilityScore ? getCredibilityStyle(credibilityScore) : null;
  const sourceInfo = getSourceInfo(article.sourceId);

  // Simulated progress for better UX
  const simulateProgress = useCallback(() => {
    const stages = [
      { progress: 20, stage: 'Analyzing article content...' },
      { progress: 40, stage: 'Extracting key information...' },
      { progress: 60, stage: 'Generating summary...' },
      { progress: 80, stage: 'Calculating credibility score...' },
      { progress: 90, stage: 'Finalizing results...' },
    ];

    let currentStage = 0;
    const interval = setInterval(() => {
      if (currentStage < stages.length) {
        setLoadingProgress(stages[currentStage].progress);
        setLoadingStage(stages[currentStage].stage);
        currentStage++;
      } else {
        clearInterval(interval);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // Effect 1: Increment View Count
  useEffect(() => {
    incrementViewCount.mutate(article.id);
  }, [article.id, incrementViewCount]);

  // Effect 2: AI Summary Logic
  useEffect(() => {
    let isMounted = true;
    let progressCleanup: (() => void) | undefined;
    const articleData = article as any;

    const loadAISummary = async () => {
      // Check if AI data already exists (from DB/prop)
      if (articleData.aiSummary) {
        if (isMounted) {
          setSummaryData({
            summary: articleData.aiSummary,
            key_points: articleData.aiKeyPoints || [],
          });
          setCredibilityScore(articleData.credibilityScore ? convertTo5PointScale(articleData.credibilityScore) : null);
          setCurrentCategory(articleData.category || article.category);
          setHasAIData(true);
          setIsLoadingSummary(false);
          setLoadingProgress(100);
        }
        return;
      }

      // No AI data - need to fetch from API
      if (isMounted) {
        setIsLoadingSummary(true);
        setSummaryError(null);
        setLoadingProgress(10);
        setLoadingStage('Connecting to AI service...');
        progressCleanup = simulateProgress();
      }

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

        if (isMounted) {
          // Update all state at once
          setLoadingProgress(100);
          setLoadingStage('Complete!');

          setSummaryData({
            summary: data.aiSummary || 'Summary not available',
            key_points: data.aiKeyPoints || [],
          });

          if (data.credibilityScore) {
            setCredibilityScore(convertTo5PointScale(data.credibilityScore));
          }

          if (data.category) {
            setCurrentCategory(data.category);
          }

          setHasAIData(true);

          // Small delay to show 100% before hiding loader
          setTimeout(() => {
            if (isMounted) {
              setIsLoadingSummary(false);
            }
          }, 500);
        }

      } catch (err) {
        console.error('AI summary error:', err);
        if (isMounted) {
          setSummaryError(err instanceof Error ? err.message : 'Failed to load summary');
          setSummaryData({
            summary: article.summary || 'Could not load AI summary. Please visit the original article.',
            key_points: [],
          });
          setIsLoadingSummary(false);
        }
      }
    };

    loadAISummary();

    return () => {
      isMounted = false;
      if (progressCleanup) {
        progressCleanup();
      }
    };
  }, [article.id, simulateProgress, article]); // Kept `article` to catch updates, but logic guards against loops via checks


  return (
    <article className="max-w-4xl mx-auto px-4">
      {/* Header Meta */}
      <header className="py-8 border-b border-border">
        <div className="flex items-center gap-4 mb-6 text-sm flex-wrap">
          <span className="font-bold uppercase tracking-widest text-primary">
            {currentCategory}
          </span>
          <span className="text-muted-foreground">|</span>
          <span className="text-muted-foreground">{sourceInfo.name}</span>
          {credibilityScore && credibilityStyle && (
            <>
              <span className="text-muted-foreground">|</span>
              <span className={cn('ai-score-badge', credibilityStyle.class)}>
                AI Rating: {credibilityScore} ★
              </span>
            </>
          )}
          {!credibilityScore && isLoadingSummary && (
            <>
              <span className="text-muted-foreground">|</span>
              <span className="text-xs text-muted-foreground animate-pulse">
                Calculating AI score...
              </span>
            </>
          )}
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
        <div className="relative w-full h-96 my-8 bg-muted">
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* AI Loading Progress Bar - Show when loading */}
      {isLoadingSummary && !hasAIData && (
        <div className="max-w-[660px] mx-auto">
          <AILoadingProgress progress={loadingProgress} stage={loadingStage} />
        </div>
      )}

      {/* AI Summary - Show when loaded */}
      {(!isLoadingSummary || hasAIData) && (
        <div className="max-w-[660px] mx-auto">
          <div className="mb-8 py-6 border-t border-b border-border">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="font-serif text-xl font-bold">AI Summary</h2>
              {hasAIData && (
                <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 rounded">
                  AI Generated
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              This is an AI-generated summary. For full content, please visit the original source.
            </p>
            <p className="text-lg leading-relaxed">
              {summaryData.summary || article.summary || 'Summary not available.'}
            </p>
            {summaryError && (
              <p className="mt-3 text-sm text-amber-600">
                {summaryError}
              </p>
            )}
          </div>

          {/* Key Points */}
          {summaryData.key_points.length > 0 && (
            <div className="mb-8">
              <h2 className="font-serif text-xl font-bold mb-4">Key Points</h2>
              <ul className="space-y-3">
                {summaryData.key_points.map((point: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-white flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </span>
                    <span className="flex-1 leading-relaxed text-foreground">
                      {point}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

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
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
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

            <div className="mt-6 p-4 bg-muted text-sm text-muted-foreground text-center rounded">
              <p>
                This summary was generated by AI. The original content belongs to <strong>{sourceInfo.name}</strong>.
              </p>
            </div>
          </footer>
        </div>
      )}
    </article>
  );
}
