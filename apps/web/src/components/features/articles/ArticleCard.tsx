import Link from 'next/link';
import Image from 'next/image';
import { Article } from '@potential-unicorn/types';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { cn } from '@/lib/utils/cn';

interface ArticleCardProps {
  article: Article;
  variant?: 'default' | 'compact' | 'featured';
}

// Helper to get credibility score styling
const getCredibilityStyle = (score: number) => {
  if (score >= 7) return { class: 'credibility-high', label: 'High' };
  if (score >= 4) return { class: 'credibility-medium', label: 'Medium' };
  return { class: 'credibility-low', label: 'Low' };
};

// Mock credibility score (will be replaced with actual AI score)
const getCredibilityScore = (article: Article) => {
  // Generate consistent score based on article ID for demo purposes
  const hash = article.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return Math.min(10, Math.max(1, (hash % 10) + 1));
};

// Get source name from sourceId (simplified mapping)
const getSourceName = (sourceId: string) => {
  const sources: Record<string, string> = {
    '550e8400-e29b-41d4-a716-446655440001': 'Online Khabar',
    '550e8400-e29b-41d4-a716-446655440002': 'eKantipur',
    '550e8400-e29b-41d4-a716-446655440003': 'Setopati',
  };
  return sources[sourceId] || 'News Source';
};

export function ArticleCard({ article, variant = 'default' }: ArticleCardProps) {
  const formattedDate = format(new Date(article.publishedAt), 'MMM dd, yyyy');
  const credibilityScore = getCredibilityScore(article);
  const credibilityStyle = getCredibilityStyle(credibilityScore);
  const sourceName = getSourceName(article.sourceId);

  if (variant === 'compact') {
    return (
      <Link href={`/articles/${article.id}`} className="block group">
        <div className="flex gap-4 p-3 rounded-xl glass card-hover">
          {article.imageUrl && (
            <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
              <Image
                src={article.imageUrl}
                alt={article.title}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
          )}
          <div className="flex-1 space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="source-badge text-primary">{sourceName}</span>
              <span className={cn('ai-score-badge text-[10px]', credibilityStyle.class)}>
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
                {credibilityScore}
              </span>
            </div>
            <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {article.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="capitalize bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px] font-medium">
                {article.category}
              </span>
              <span>•</span>
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'featured') {
    return (
      <Link href={`/articles/${article.id}`} className="block group">
        <Card className="overflow-hidden border-0 shadow-2xl card-hover rounded-2xl">
          {article.imageUrl && (
            <div className="relative w-full h-[450px] overflow-hidden">
              <Image
                src={article.imageUrl}
                alt={article.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

              {/* Badges */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                <span className="source-badge text-gray-800 shadow-lg">
                  📰 {sourceName}
                </span>
                <span className={cn('ai-score-badge shadow-lg', credibilityStyle.class)}>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                  AI Score: {credibilityScore}/10
                </span>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <div className="mb-3 flex items-center gap-3">
                  <span className="inline-block px-4 py-1.5 gradient-primary text-white text-xs font-bold rounded-full uppercase tracking-wider shadow-lg">
                    {article.category}
                  </span>
                  <span className="text-white/70 text-sm">
                    {formattedDate}
                  </span>
                </div>
                <h2 className="text-4xl font-bold mb-3 leading-tight group-hover:text-purple-200 transition-colors">
                  {article.title}
                </h2>
                <p className="text-base text-white/85 mb-4 line-clamp-2 max-w-3xl">
                  {article.summary || 'Read the AI-powered summary of this article...'}
                </p>
                <div className="flex items-center gap-4 text-sm text-white/70">
                  {article.author && <span className="font-medium">{article.author}</span>}
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {article.viewCount} views
                  </span>
                </div>
              </div>
            </div>
          )}
        </Card>
      </Link>
    );
  }

  // Default variant - modern card design
  return (
    <Link href={`/articles/${article.id}`} className="block group">
      <Card className="overflow-hidden glass border-0 shadow-md card-hover rounded-xl">
        <div className="relative">
          {article.imageUrl && (
            <div className="relative w-full h-52 overflow-hidden">
              <Image
                src={article.imageUrl}
                alt={article.title}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          )}

          {/* Badges overlay */}
          <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
            <span className="source-badge text-gray-700 text-[11px]">
              {sourceName}
            </span>
            <span className={cn('ai-score-badge text-[11px] shadow-md', credibilityStyle.class)}>
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              {credibilityScore}
            </span>
          </div>
        </div>

        <CardContent className="p-5">
          <div className="mb-3">
            <span className="inline-block px-3 py-1 bg-gradient-to-r from-primary/20 to-accent/20 text-primary text-xs font-semibold rounded-full capitalize">
              {article.category}
            </span>
          </div>
          <h3 className="text-lg font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
            {article.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {article.summary || 'Click to read the AI-powered summary...'}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formattedDate}
              </span>
            </div>
            <span className="flex items-center gap-1 text-primary font-medium">
              Read Summary
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

