'use client';

import Link from 'next/link';
import { useTrendingArticles } from '@/lib/hooks/useArticles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

export function Sidebar() {
  const { data: trendingArticles, isLoading } = useTrendingArticles(5);

  return (
    <aside className="space-y-6">
      {/* Trending Articles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Trending Now</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-full mb-2" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {trendingArticles?.map((article, index) => (
                <Link
                  key={article.id}
                  href={`/articles/${article.id}`}
                  className="block group"
                >
                  <div className="flex gap-3">
                    <span className="text-2xl font-bold text-muted-foreground/30 flex-shrink-0">
                      {index + 1}
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium leading-tight group-hover:text-primary transition-colors line-clamp-2">
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
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
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
                className="block text-sm text-muted-foreground hover:text-primary transition-colors capitalize"
              >
                {category}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Newsletter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Newsletter</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Get the latest news delivered to your inbox.
          </p>
          <div className="space-y-2">
            <input
              type="email"
              placeholder="Your email"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <button className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium">
              Subscribe
            </button>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}
