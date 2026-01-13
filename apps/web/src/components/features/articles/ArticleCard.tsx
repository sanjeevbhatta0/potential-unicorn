import Link from 'next/link';
import Image from 'next/image';
import { Article } from '@potential-unicorn/types';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { cn } from '@/lib/utils/cn';

interface ArticleCardProps {
  article: Article;
  variant?: 'default' | 'compact' | 'featured';
}

export function ArticleCard({ article, variant = 'default' }: ArticleCardProps) {
  const formattedDate = format(new Date(article.publishedAt), 'MMM dd, yyyy');

  if (variant === 'compact') {
    return (
      <Link href={`/articles/${article.id}`} className="block group">
        <div className="flex gap-4">
          {article.imageUrl && (
            <div className="relative w-24 h-24 flex-shrink-0 rounded-md overflow-hidden">
              <Image
                src={article.imageUrl}
                alt={article.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
          <div className="flex-1 space-y-1">
            <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {article.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="capitalize">{article.category}</span>
              <span>•</span>
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'featured') {
    return (
      <Link href={`/articles/${article.id}`} className="block group">
        <Card className="overflow-hidden border-0 shadow-lg">
          {article.imageUrl && (
            <div className="relative w-full h-96 overflow-hidden">
              <Image
                src={article.imageUrl}
                alt={article.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <div className="mb-2">
                  <span className="inline-block px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full capitalize">
                    {article.category}
                  </span>
                </div>
                <h2 className="text-3xl font-bold mb-2 group-hover:text-primary-foreground transition-colors">
                  {article.title}
                </h2>
                <p className="text-sm text-white/90 mb-2 line-clamp-2">
                  {article.summary}
                </p>
                <div className="flex items-center gap-2 text-sm text-white/80">
                  {article.author && <span>{article.author}</span>}
                  {article.author && <span>•</span>}
                  <span>{formattedDate}</span>
                  <span>•</span>
                  <span>{article.viewCount} views</span>
                </div>
              </div>
            </div>
          )}
        </Card>
      </Link>
    );
  }

  // Default variant
  return (
    <Link href={`/articles/${article.id}`} className="block group">
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        {article.imageUrl && (
          <div className="relative w-full h-48 overflow-hidden">
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <CardContent className="p-4">
          <div className="mb-2">
            <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded capitalize">
              {article.category}
            </span>
          </div>
          <h3 className="text-lg font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {article.summary}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              {article.author && <span>{article.author}</span>}
              {article.author && <span>•</span>}
              <span>{formattedDate}</span>
            </div>
            <span>{article.viewCount} views</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
