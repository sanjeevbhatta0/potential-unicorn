'use client';

import { useArticles } from '@/lib/hooks/useArticles';
import { ArticleList } from '@/components/features/articles';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Category } from '@potential-unicorn/types';

interface CategoryPageProps {
  params: {
    category: string;
  };
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const [page, setPage] = useState(1);
  const limit = Number(process.env.NEXT_PUBLIC_ITEMS_PER_PAGE) || 20;
  const category = params.category as Category;

  const { data: articlesData, isLoading } = useArticles({
    category,
    page,
    limit,
    sortBy: 'publishedAt',
    sortOrder: 'desc',
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <section>
            <div className="mb-6">
              <h1 className="text-3xl font-bold capitalize mb-2">{category}</h1>
              <p className="text-muted-foreground">
                Latest news and updates in {category}
              </p>
            </div>

            <div className="flex items-center justify-between mb-6">
              <div className="text-sm text-muted-foreground">
                {articlesData?.total || 0} articles found
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
            {articlesData && articlesData.totalPages > 1 && (
              <div className="mt-8 text-center text-sm text-muted-foreground">
                Page {page} of {articlesData.totalPages}
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
