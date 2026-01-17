'use client';

import Link from 'next/link';
import { useTrendingArticles } from '@/lib/hooks/useArticles';
import { format } from 'date-fns';

export function Sidebar() {
  const { data: trendingArticles, isLoading } = useTrendingArticles(5);

  return (
    <aside className="space-y-10">
      {/* Trending Articles */}
      <section>
        <h3 className="font-serif text-xl font-bold mb-6 pb-2 border-b border-border">
          Trending Now
        </h3>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 w-full mb-2" />
                <div className="h-3 bg-gray-200 w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {trendingArticles?.map((article, index) => (
              <Link
                key={article.id}
                href={`/articles/${article.id}`}
                className="block group"
              >
                <div className="flex gap-4">
                  <span className="text-3xl font-serif font-bold text-gray-200 flex-shrink-0">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="space-y-1">
                    <h4 className="font-serif font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                      {article.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(article.publishedAt), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Categories */}
      <section>
        <h3 className="font-serif text-xl font-bold mb-6 pb-2 border-b border-border">
          Categories
        </h3>
        <div className="space-y-3">
          {[
            'politics',
            'business',
            'sports',
            'technology',
            'entertainment',
            'health',
            'education',
            'world',
          ].map((category) => (
            <Link
              key={category}
              href={`/categories/${category}`}
              className="block text-muted-foreground hover:text-primary transition-colors capitalize font-medium"
            >
              {category}
            </Link>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="border-t border-border pt-8">
        <h3 className="font-serif text-xl font-bold mb-4">
          Newsletter
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Get the latest news delivered to your inbox.
        </p>
        <div className="space-y-3">
          <input
            type="email"
            placeholder="Your email"
            className="flex h-10 w-full border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
          <button className="w-full h-10 bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
            Subscribe
          </button>
        </div>
      </section>
    </aside>
  );
}
