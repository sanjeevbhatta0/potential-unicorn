'use client';

import Link from 'next/link';
import { useTrendingArticles } from '@/lib/hooks/useArticles';
import { format } from 'date-fns';

export function Sidebar() {
  const { data: trendingArticles, isLoading } = useTrendingArticles(5);

  return (
    <aside className="space-y-6 text-sm">
      {/* Trending Articles */}
      <section>
        <h3 className="font-serif text-base font-bold mb-3 pb-2 border-b border-border">
          Trending
        </h3>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-3 bg-gray-200 w-full mb-1" />
                <div className="h-2 bg-gray-200 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {trendingArticles?.map((article, index) => (
              <Link
                key={article.id}
                href={`/articles/${article.id}`}
                className="block group"
              >
                <div className="flex gap-2">
                  <span className="text-lg font-bold text-gray-300 flex-shrink-0 w-5">
                    {index + 1}
                  </span>
                  <div>
                    <h4 className="text-xs font-medium leading-tight group-hover:text-primary transition-colors line-clamp-2">
                      {article.title}
                    </h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {format(new Date(article.publishedAt), 'MMM dd')}
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
        <h3 className="font-serif text-base font-bold mb-3 pb-2 border-b border-border">
          Categories
        </h3>
        <div className="space-y-1.5">
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
              className="block text-xs text-muted-foreground hover:text-primary transition-colors capitalize"
            >
              {category}
            </Link>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="border-t border-border pt-4">
        <h3 className="font-serif text-base font-bold mb-2">
          Newsletter
        </h3>
        <p className="text-[10px] text-muted-foreground mb-2">
          Get news delivered to your inbox.
        </p>
        <div className="space-y-2">
          <input
            type="email"
            placeholder="Your email"
            className="flex h-8 w-full border border-border bg-white px-2 py-1 text-xs focus:outline-none focus:border-primary"
          />
          <button className="w-full h-8 bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors">
            Subscribe
          </button>
        </div>
      </section>
    </aside>
  );
}
