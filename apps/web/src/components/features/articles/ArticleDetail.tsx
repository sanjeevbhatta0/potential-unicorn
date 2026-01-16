'use client';

import Image from 'next/image';
import { Article } from '@potential-unicorn/types';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useArticleStore } from '@/lib/store/articleStore';
import { useEffect } from 'react';
import { useIncrementViewCount } from '@/lib/hooks/useArticles';

interface ArticleDetailProps {
  article: Article;
}

export function ArticleDetail({ article }: ArticleDetailProps) {
  const { isBookmarked, toggleBookmark } = useArticleStore();
  const incrementViewCount = useIncrementViewCount();
  const bookmarked = isBookmarked(article.id);

  useEffect(() => {
    // Increment view count when article is viewed
    incrementViewCount.mutate(article.id);
  }, [article.id]);

  return (
    <article className="max-w-4xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <div className="mb-4">
          <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full capitalize">
            {article.category}
          </span>
        </div>
        <h1 className="text-4xl font-bold mb-4 leading-tight">{article.title}</h1>

        {/* Meta info */}
        <div className="flex items-center justify-between flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            {article.author && (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div>
                  <p className="font-medium text-foreground">{article.author}</p>
                  <p className="text-xs">{format(new Date(article.publishedAt), 'MMMM dd, yyyy')}</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span>{article.viewCount} views</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleBookmark(article.id)}
            >
              {bookmarked ? 'Bookmarked' : 'Bookmark'}
            </Button>
            <Button variant="outline" size="sm">
              Share
            </Button>
          </div>
        </div>
      </header>

      {/* Featured Image */}
      {article.imageUrl && (
        <div className="relative w-full h-96 mb-8 rounded-lg overflow-hidden">
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Summary */}
      {article.summary && (
        <div className="mb-8 p-6 bg-muted/50 rounded-lg border-l-4 border-primary">
          <h2 className="text-lg font-semibold mb-2">Summary</h2>
          <p className="text-muted-foreground leading-relaxed">{article.summary}</p>
        </div>
      )}

      {/* Highlights */}
      {article.highlights && article.highlights.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Key Highlights</h2>
          <ul className="space-y-2">
            {article.highlights.map((highlight, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <span className="flex-1 text-muted-foreground">{highlight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Content */}
      <div className="prose prose-lg dark:prose-invert max-w-none mb-8">
        <div
          dangerouslySetInnerHTML={{ __html: article.content }}
          className="leading-relaxed"
        />
      </div>

      {/* Tags */}
      {article.tags && article.tags.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-muted text-sm rounded-full hover:bg-muted/80 cursor-pointer transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="pt-8 border-t">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Published on {format(new Date(article.publishedAt), 'MMMM dd, yyyy')}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Report Issue
            </Button>
          </div>
        </div>
      </footer>
    </article>
  );
}
