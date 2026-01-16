'use client';

import { useArticles, useTrendingArticles } from '@/lib/hooks/useArticles';
import { ArticleCard, ArticleList } from '@/components/features/articles';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function HomePage() {
  const [page, setPage] = useState(1);
  const limit = Number(process.env.NEXT_PUBLIC_ITEMS_PER_PAGE) || 20;

  const { data: articlesData, isLoading } = useArticles({
    page,
    limit,
    sortBy: 'publishedAt',
    sortOrder: 'desc',
  });

  const { data: trendingArticles } = useTrendingArticles(1);
  const featuredArticle = trendingArticles?.[0];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Featured Article */}
      {featuredArticle && (
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Featured Story</h2>
          <ArticleCard article={featuredArticle} variant="featured" />
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Latest News</h2>
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
                  disabled={
                    !articlesData ||
                    page >= articlesData.totalPages
                  }
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
              <div className="mt-8 text-center text-sm text-muted-foreground">
                Page {page} of {articlesData.totalPages} ({articlesData.total} total articles)
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <Sidebar />
        </aside>
      </div>
    </div>
  );
}
