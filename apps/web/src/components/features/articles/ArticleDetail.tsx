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
  if (score >= 7) return { class: 'credibility-high', label: 'उच्च विश्वसनीयता', color: 'text-emerald-600' };
  if (score >= 4) return { class: 'credibility-medium', label: 'मध्यम विश्वसनीयता', color: 'text-amber-600' };
  return { class: 'credibility-low', label: 'कम विश्वसनीयता', color: 'text-red-600' };
};

// Get credibility score - use persisted AI score if available, otherwise use mock
const getCredibilityScore = (article: Article) => {
  // Check for persisted credibility score from AI processing
  const articleData = article as any;
  if (articleData.credibilityScore && typeof articleData.credibilityScore === 'number') {
    return articleData.credibilityScore;
  }
  // Fallback to mock score for unprocessed articles
  const hash = article.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return Math.min(10, Math.max(1, (hash % 10) + 1));
};

// Get source name from sourceId
const getSourceInfo = (sourceId: string) => {
  const sources: Record<string, { name: string; url: string; logo: string }> = {
    '550e8400-e29b-41d4-a716-446655440001': { name: 'अनलाइनखबर', url: 'https://onlinekhabar.com', logo: '📰' },
    '550e8400-e29b-41d4-a716-446655440002': { name: 'ईकान्तिपुर', url: 'https://ekantipur.com', logo: '📰' },
    '550e8400-e29b-41d4-a716-446655440003': { name: 'सेतोपाटी', url: 'https://setopati.com', logo: '📰' },
  };
  return sources[sourceId] || { name: 'समाचार स्रोत', url: '#', logo: '📰' };
};

// Default Nepali placeholder text while loading
const DEFAULT_NEPALI_KEY_POINTS = [
  'यो लेखको मुख्य तथ्यहरू AI द्वारा विश्लेषण गरिँदैछ...',
  'बहु-स्रोतहरूसँग क्रस-रेफरेन्स गरिँदैछ...',
  'थप सन्दर्भ जानकारी थपिँदैछ...',
];

export function ArticleDetail({ article }: ArticleDetailProps) {
  const { isBookmarked, toggleBookmark } = useArticleStore();
  const incrementViewCount = useIncrementViewCount();
  const bookmarked = isBookmarked(article.id);

  // State for AI summary
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [summaryData, setSummaryData] = useState<AISummaryData>({
    summary: '',
    key_points: [],
  });
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const credibilityScore = getCredibilityScore(article);
  const credibilityStyle = getCredibilityStyle(credibilityScore);
  const sourceInfo = getSourceInfo(article.sourceId);

  // Hybrid AI loading: use persisted data if available, otherwise process on-demand
  useEffect(() => {
    incrementViewCount.mutate(article.id);

    const loadAISummary = async () => {
      // Check if article already has AI data (processed at crawl-time or previously viewed)
      const articleData = article as any;
      if (articleData.aiSummary) {
        // Use persisted data - instant load!
        setSummaryData({
          summary: articleData.aiSummary,
          key_points: articleData.aiKeyPoints || [],
        });
        setIsLoadingSummary(false);
        return;
      }

      // No persisted data - call API to process and persist
      setIsLoadingSummary(true);
      setSummaryError(null);

      try {
        // Call the new process-ai endpoint which will persist the result
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api/v1';
        const response = await fetch(`${apiUrl}/articles/${article.id}/process-ai`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error('AI सेवा अस्थायी रूपमा उपलब्ध छैन');
        }

        const data = await response.json();
        setSummaryData({
          summary: data.aiSummary || 'सारांश उपलब्ध छैन',
          key_points: data.aiKeyPoints || [],
        });
      } catch (err) {
        console.error('AI summary error:', err);
        setSummaryError(err instanceof Error ? err.message : 'सारांश प्राप्त गर्न असफल');
        // Use fallback
        setSummaryData({
          summary: article.summary || 'यो समाचारको AI सारांश लोड गर्न सकिएन। कृपया मूल लेखमा जानुहोस्।',
          key_points: DEFAULT_NEPALI_KEY_POINTS,
        });
      } finally {
        setIsLoadingSummary(false);
      }
    };

    loadAISummary();
  }, [article.id]);

  return (
    <article className="max-w-4xl mx-auto">
      {/* Source and Credibility Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{sourceInfo.logo}</span>
          <div>
            <p className="text-sm text-muted-foreground">Source</p>
            <p className="font-bold text-lg">{sourceInfo.name}</p>
          </div>
        </div>

        {/* AI Credibility Score */}
        <div className="flex items-center gap-3 px-5 py-3 rounded-xl glass">
          <div className="flex flex-col items-center">
            <div className={cn('text-3xl font-bold', credibilityStyle.color)}>
              {credibilityScore}
              <span className="text-lg">/10</span>
            </div>
            <span className="text-xs text-muted-foreground">AI Score</span>
          </div>
          <div className="w-px h-10 bg-border" />
          <div>
            <span className={cn('ai-score-badge', credibilityStyle.class)}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              {credibilityStyle.label}
            </span>
          </div>
        </div>
      </div>

      {/* Category and Header */}
      <header className="mb-8">
        <div className="mb-4">
          <span className="inline-block px-4 py-1.5 gradient-primary text-white text-sm font-bold rounded-full capitalize">
            {article.category}
          </span>
        </div>
        <h1 className="text-4xl font-bold mb-4 leading-tight">{article.title}</h1>

        {/* Meta info */}
        <div className="flex items-center justify-between flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            {article.author && (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold">
                  {article.author.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-foreground">{article.author}</p>
                  <p className="text-xs">{format(new Date(article.publishedAt), 'MMMM dd, yyyy')}</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {article.viewCount} views
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleBookmark(article.id)}
              className="rounded-full glass border-0"
            >
              {bookmarked ? '★ Bookmarked' : '☆ Bookmark'}
            </Button>
          </div>
        </div>
      </header>

      {/* Featured Image */}
      {article.imageUrl && (
        <div className="relative w-full h-96 mb-8 rounded-2xl overflow-hidden shadow-xl">
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      )}

      {/* AI Summary Notice */}
      <div className="mb-8 p-6 rounded-2xl glass border-l-4 border-primary">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">🤖</span>
          <h2 className="text-xl font-bold text-gradient">AI सारांश</h2>
          {isLoadingSummary && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs animate-pulse">
              <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              AI ले सारांश बनाउँदैछ...
            </span>
          )}
        </div>
        <p className="text-muted-foreground text-sm mb-4">
          यो AI-उत्पन्न सारांश हो। पूर्ण मूल सामग्रीको लागि, कृपया स्रोतमा जानुहोस्।
        </p>
        <p className={cn('text-lg leading-relaxed', isLoadingSummary && 'animate-pulse text-muted-foreground')}>
          {isLoadingSummary
            ? 'AI सारांश तयार गरिँदैछ... कृपया केही क्षण पर्खनुहोस्।'
            : summaryData.summary || article.summary || 'सारांश उपलब्ध छैन।'
          }
        </p>
        {summaryError && (
          <p className="mt-3 text-sm text-amber-600">
            ⚠️ {summaryError}
          </p>
        )}
      </div>

      {/* AI Key Points */}
      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">💡</span>
          <h2 className="text-xl font-bold">मुख्य बुँदाहरू</h2>
          {isLoadingSummary && (
            <span className="text-xs text-muted-foreground animate-pulse">लोड हुँदैछ...</span>
          )}
        </div>
        <ul className="space-y-3">
          {(summaryData.key_points.length > 0 ? summaryData.key_points : DEFAULT_NEPALI_KEY_POINTS).map((point: string, index: number) => (
            <li key={index} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full gradient-primary text-white flex items-center justify-center text-sm font-bold shadow-md">
                {index + 1}
              </span>
              <span className={cn('flex-1 leading-relaxed', isLoadingSummary ? 'text-muted-foreground animate-pulse' : 'text-foreground')}>
                {point}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Read Original Article CTA */}
      <div className="mb-8 p-8 rounded-2xl gradient-hero text-white text-center">
        <h3 className="text-2xl font-bold mb-3">पूरा लेख पढ्न चाहनुहुन्छ?</h3>
        <p className="text-white/80 mb-6 max-w-lg mx-auto">
          मूल स्रोतमा जानुहोस् पूर्ण कथा, सबै विवरण, उद्धरण र मल्टिमिडिया सामग्री सहित।
        </p>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary font-bold rounded-full hover:shadow-xl hover:scale-105 transition-all duration-300"
        >
          <span>Read Full Article on {sourceInfo.name}</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      {/* Tags */}
      {article.tags && article.tags.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Related Topics</h3>
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="px-4 py-1.5 glass text-sm rounded-full hover:shadow-md transition-shadow cursor-pointer"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="pt-8 border-t">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Original Source:</span> {sourceInfo.name} •
            Published {format(new Date(article.publishedAt), 'MMMM dd, yyyy')}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-full glass border-0">
              🔗 Share
            </Button>
            <Button variant="outline" size="sm" className="rounded-full glass border-0">
              ⚠️ Report
            </Button>
          </div>
        </div>

        {/* Copyright Notice */}
        <div className="mt-6 p-4 rounded-xl bg-muted/50 text-sm text-muted-foreground text-center">
          <p>
            This summary was generated by AI. The original content belongs to <strong>{sourceInfo.name}</strong>.
            Click the link above to read the full article on their website.
          </p>
        </div>
      </footer>
    </article>
  );
}

