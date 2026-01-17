'use client';

import { useArticles, useTrendingArticles } from '@/lib/hooks/useArticles';
import { ArticleCard, ArticleList } from '@/components/features/articles';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Category } from '@potential-unicorn/types';

// Category configuration
const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'politics', label: 'Politics' },
  { id: 'sports', label: 'Sports' },
  { id: 'business', label: 'Business' },
  { id: 'technology', label: 'Technology' },
  { id: 'entertainment', label: 'Entertainment' },
];

export default function HomePage() {
  const [page, setPage] = useState(1);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const limit = Number(process.env.NEXT_PUBLIC_ITEMS_PER_PAGE) || 20;

  const { data: articlesData, isLoading } = useArticles({
    page,
    limit,
    category: activeCategory || undefined,
    sortBy: 'publishedAt',
    sortOrder: 'desc',
  });

  const { data: trendingArticles } = useTrendingArticles(1);
  const featuredArticle = trendingArticles?.[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Featured Article */}
      {featuredArticle && (
        <section className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-12">
            <div className="mb-6">
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                <span className="w-2 h-2 bg-primary" />
                Featured Story
              </span>
            </div>
            <ArticleCard article={featuredArticle} variant="featured" />
          </div>
        </section>
      )}

      {/* Category Navigation */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-1 py-4 overflow-x-auto">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 text-sm font-semibold uppercase tracking-wide transition-colors ${
                !activeCategory
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 text-sm font-semibold uppercase tracking-wide transition-colors ${
                  activeCategory === cat.id
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <section>
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
            <div>
              <h2 className="font-serif text-3xl font-bold">
                {activeCategory
                  ? CATEGORIES.find(c => c.id === activeCategory)?.label || 'News'
                  : 'Latest News'
                }
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                AI-verified stories from trusted sources
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!articlesData || page >= articlesData.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>

          <ArticleList
            articles={articlesData?.data || []}
            isLoading={isLoading}
            variant="default"
          />

          {/* Pagination Info */}
          {articlesData && (
            <div className="mt-10 pt-6 border-t border-border text-center">
              <span className="text-sm text-muted-foreground">
                Page <span className="font-bold text-foreground">{page}</span> of{' '}
                <span className="font-bold text-foreground">{articlesData.totalPages}</span>
                {' | '}
                <span className="font-bold text-primary">{articlesData.total}</span> articles
              </span>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
