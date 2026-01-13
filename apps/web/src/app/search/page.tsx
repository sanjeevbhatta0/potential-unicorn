'use client';

import { useSearchParams } from 'next/navigation';
import { useSearchArticles } from '@/lib/hooks/useArticles';
import { ArticleList } from '@/components/features/articles';
import { Sidebar } from '@/components/layout/Sidebar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [activeQuery, setActiveQuery] = useState(queryParam);

  const { data: searchResults, isLoading } = useSearchArticles(activeQuery);

  useEffect(() => {
    setSearchQuery(queryParam);
    setActiveQuery(queryParam);
  }, [queryParam]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveQuery(searchQuery);
    // Update URL with new search query
    const params = new URLSearchParams();
    if (searchQuery) {
      params.set('q', searchQuery);
    }
    window.history.pushState(null, '', `?${params.toString()}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <section>
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-4">Search Articles</h1>
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  type="search"
                  placeholder="Search for news..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit">Search</Button>
              </form>
            </div>

            {activeQuery && (
              <div className="mb-6">
                <p className="text-sm text-muted-foreground">
                  {isLoading
                    ? 'Searching...'
                    : `Found ${searchResults?.total || 0} results for "${activeQuery}"`}
                </p>
              </div>
            )}

            {!activeQuery ? (
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
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Start Searching</h3>
                <p className="text-muted-foreground">
                  Enter a search term above to find relevant articles
                </p>
              </div>
            ) : (
              <ArticleList
                articles={searchResults?.data || []}
                isLoading={isLoading}
                variant="default"
              />
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
