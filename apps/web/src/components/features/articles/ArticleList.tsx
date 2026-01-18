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
          "grid grid-cols-1 md:grid-cols-12 gap-6",
          className
        )}
      >
        {[...Array(14)].map((_, index) => {
          let spanClass = "md:col-span-4";

          if (index === 0 || index === 1) {
            spanClass = "md:col-span-6";
          } else {
            const i = (index - 2) % 12;
            if (i <= 3) spanClass = "md:col-span-3";
            else if (i <= 6) spanClass = "md:col-span-4";
            else if (i <= 8) spanClass = "md:col-span-6";
            else if (i >= 9) spanClass = "md:col-span-4";
          }

          return (
            <div key={index} className={cn("animate-pulse col-span-1", spanClass)}>
              <div className="bg-muted rounded-lg h-56 mb-4" />
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          )
        })}
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

  if (variant === 'default' || variant === 'grid') { // Treat default as grid (or check if user passed bento)
    // Actually, user wants to REPLACE "2 tiles in a row" (default) with Bento.
    // So 'default' variant should now behave like 'dynamic'.

    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-12 gap-6", className)}>
        {articles.map((article, index) => {
          let spanClass = "md:col-span-4"; // Default

          if (index === 0 || index === 1) {
            // First Row: Always 2 tiles
            spanClass = "md:col-span-6";
          } else {
            // Subsequent Rows: Dense Pattern (shifted by 2)
            const i = (index - 2) % 12;

            // Row 1: 4 items (Span 3)
            if (i <= 3) spanClass = "md:col-span-3";
            // Row 2: 3 items (Span 4)
            else if (i <= 6) spanClass = "md:col-span-4";
            // Row 3: 2 items (Span 6)
            else if (i <= 8) spanClass = "md:col-span-6";
            // Row 4: 3 items (Span 4)
            else if (i >= 9) spanClass = "md:col-span-4";
          }

          return (
            <ArticleCard
              key={article.id}
              article={article}
              variant="grid"
              className={spanClass}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={cn(
        {
          'space-y-4': variant === 'compact',
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
