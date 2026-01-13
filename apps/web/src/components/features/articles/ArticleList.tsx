'use client';

import { ArticleCard } from './ArticleCard';
import { Article } from '@potential-unicorn/types';
import { cn } from '@/lib/utils/cn';

interface ArticleListProps {
  articles: Article[];
  isLoading?: boolean;
  variant?: 'default' | 'compact' | 'grid';
  className?: string;
}

export function ArticleList({
  articles,
  isLoading = false,
  variant = 'default',
  className,
}: ArticleListProps) {
  if (isLoading) {
    return (
      <div
        className={cn(
          {
            'grid gap-6 md:grid-cols-2 lg:grid-cols-3': variant === 'grid',
            'space-y-4': variant === 'compact',
            'grid gap-6 md:grid-cols-2': variant === 'default',
          },
          className
        )}
      >
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-muted rounded-lg h-48 mb-4" />
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!articles || articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-6 mb-4">
          <svg
            className="w-12 h-12 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2">No articles found</h3>
        <p className="text-muted-foreground">
          Try adjusting your filters or check back later for new content.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        {
          'grid gap-6 md:grid-cols-2 lg:grid-cols-3': variant === 'grid',
          'space-y-4': variant === 'compact',
          'grid gap-6 md:grid-cols-2': variant === 'default',
        },
        className
      )}
    >
      {articles.map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          variant={variant === 'compact' ? 'compact' : 'default'}
        />
      ))}
    </div>
  );
}
