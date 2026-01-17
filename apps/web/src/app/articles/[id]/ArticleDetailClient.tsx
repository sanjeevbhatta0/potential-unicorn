'use client';

import { useArticle } from '@/lib/hooks/useArticles';
import { ArticleDetail } from '@/components/features/articles';

interface ArticleDetailClientProps {
  articleId: string;
}

export function ArticleDetailClient({ articleId }: ArticleDetailClientProps) {
  const { data: article, isLoading, error } = useArticle(articleId);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-1/4" />
            <div className="h-12 bg-muted rounded w-3/4" />
            <div className="h-96 bg-muted rounded" />
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The article you&apos;re looking for doesn&apos;t exist or has been removed.

          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <ArticleDetail article={article} />
      </div>
    </div>
  );
}
