'use client';

import { useArticles, useTrendingArticles } from '@/lib/hooks/useArticles';
import { ArticleCard, ArticleList } from '@/components/features/articles';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Category } from '@potential-unicorn/types';
import { useSearchParams, useRouter } from 'next/navigation';

// Category map for labels
const CATEGORY_LABELS: Record<string, string> = {
  politics: 'Politics',
  sports: 'Sports',
  business: 'Business',
  technology: 'Technology',
  entertainment: 'Entertainment',
  education: 'Education',
  health: 'Health',
  international: 'International',
  opinion: 'Opinion',
  general: 'General',
};

export default function HomePage() {
  const [page, setPage] = useState(1);
  const searchParams = useSearchParams();
  const router = useRouter();

  const categoryParam = searchParams.get('category');
  const activeCategory = categoryParam as Category | undefined;

  const limit = Number(process.env.NEXT_PUBLIC_ITEMS_PER_PAGE) || 20;

  const { data: articlesData, isLoading } = useArticles({
    page,
    limit,
    category: activeCategory, // Pass category from URL
    sortBy: 'publishedAt',
    sortOrder: 'desc',
    // includeTests defaults to false, so tests are hidden
  });

  const { data: trendingArticles } = useTrendingArticles(1);
  const featuredArticle = trendingArticles?.[0];

  // Reset page when category changes
  // Note: Since we use useQuery keys that include params, page reset needs handling.
  // Best done via useEffect if needed, but for simplicity let's keep page state.
  // Ideally page should also be in URL.

  return (
    <div className="min-h-screen bg-background">
      {/* Featured Article - Only show on Home (no category selected) */}
      {!activeCategory && featuredArticle && (
        <section className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-12">
            <div className="mb-6">
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                <span className="w-2 h-2 bg-primary animate-pulse" />
                Featured Story
              </span>
            </div>
            <ArticleCard article={featuredArticle} variant="featured" />
          </div>
        </section>
      )}

      {/* Category Navigation (Removed - Moved to Header) */}

      <div className="container mx-auto px-4 py-8 md:py-12">
        <section>
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
            <div>
              <h2 className="font-serif text-3xl font-bold tracking-tight">
                {activeCategory
                  ? CATEGORY_LABELS[activeCategory] || 'News'
                  : 'Latest News'
                }
              </h2>
              <p className="text-muted-foreground mt-2 text-sm">
                {activeCategory
                  ? `Latest updates in ${CATEGORY_LABELS[activeCategory] || activeCategory}`
                  : 'AI-verified stories from trusted sources'
                }
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
          {articlesData && articlesData.data.length > 0 && (
            <div className="mt-10 pt-6 border-t border-border text-center">
              <span className="text-sm text-muted-foreground">
                Page <span className="font-bold text-foreground">{page}</span> of{' '}
                <span className="font-bold text-foreground">{articlesData.totalPages}</span>
                {' | '}
                <span className="font-bold text-primary">{articlesData.total}</span> articles
              </span>
            </div>
          )}

          {articlesData && articlesData.data.length === 0 && !isLoading && (
            <div className="py-20 text-center">
              <p className="text-muted-foreground">No articles found in this category.</p>
              <Button variant="link" onClick={() => router.push('/')} className="mt-4">
                Go back home
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
