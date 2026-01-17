'use client';

import { useArticles, useTrendingArticles } from '@/lib/hooks/useArticles';
import { ArticleCard, ArticleList } from '@/components/features/articles';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Category } from '@potential-unicorn/types';

// Category configuration
const CATEGORIES: { id: Category; label: string; icon: string; color: string }[] = [
  { id: 'politics', label: 'Politics', icon: '🏛️', color: 'from-blue-500 to-indigo-600' },
  { id: 'sports', label: 'Sports', icon: '⚽', color: 'from-green-500 to-emerald-600' },
  { id: 'business', label: 'Business', icon: '💼', color: 'from-amber-500 to-orange-600' },
  { id: 'technology', label: 'Technology', icon: '💻', color: 'from-purple-500 to-violet-600' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬', color: 'from-pink-500 to-rose-600' },
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
    <div className="min-h-screen">
      {/* Hero Section with Featured Article */}
      {featuredArticle && (
        <section className="relative mb-12">
          <div className="absolute inset-0 gradient-hero opacity-95" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          <div className="container mx-auto px-4 py-16 relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-white text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Breaking News
              </span>
              <span className="text-white/60 text-sm">Updated just now</span>
            </div>
            <ArticleCard article={featuredArticle} variant="featured" />
          </div>
        </section>
      )}

      {/* Category Pills */}
      <div className="container mx-auto px-4 mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-300 ${!activeCategory
              ? 'gradient-primary text-white shadow-lg scale-105'
              : 'glass text-foreground hover:shadow-md hover:scale-105'
              }`}
          >
            🌐 All News
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-300 ${activeCategory === cat.id
                ? `bg-gradient-to-r ${cat.color} text-white shadow-lg scale-105`
                : 'glass text-foreground hover:shadow-md hover:scale-105'
                }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <section>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-gradient">
                    {activeCategory
                      ? CATEGORIES.find(c => c.id === activeCategory)?.label || 'News'
                      : 'Latest News'
                    }
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    AI-verified stories from trusted sources
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-full glass border-0 hover:shadow-md"
                  >
                    ← Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!articlesData || page >= articlesData.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-full glass border-0 hover:shadow-md"
                  >
                    Next →
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
                <div className="mt-10 text-center">
                  <div className="inline-flex items-center gap-4 px-6 py-3 rounded-full glass">
                    <span className="text-sm text-muted-foreground">
                      Page <span className="font-bold text-foreground">{page}</span> of{' '}
                      <span className="font-bold text-foreground">{articlesData.totalPages}</span>
                    </span>
                    <span className="w-px h-4 bg-border" />
                    <span className="text-sm text-muted-foreground">
                      <span className="font-bold text-primary">{articlesData.total}</span> articles
                    </span>
                  </div>
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

      {/* Footer gradient */}
      <div className="h-32 bg-gradient-to-t from-primary/5 to-transparent" />
    </div>
  );
}

