import Link from 'next/link';
import Image from 'next/image';
import { Article } from '@potential-unicorn/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils/cn';

interface ArticleCardProps {
  article: Article;
  variant?: 'default' | 'compact' | 'featured' | 'grid';
  className?: string;
}

// Helper to get credibility score styling (5-point scale)
const getCredibilityStyle = (score: number) => {
  if (score >= 3.5) return { class: 'bg-emerald-600 text-white', label: 'High' };
  if (score >= 2) return { class: 'bg-amber-500 text-white', label: 'Medium' };
  return { class: 'bg-red-600 text-white', label: 'Low' };
};

// Get actual credibility score from article data (converted to 5-point scale)
const getCredibilityScore = (article: Article): number | null => {
  const articleData = article as any;
  if (articleData.credibilityScore && typeof articleData.credibilityScore === 'number') {
    // Convert from 10-point to 5-point scale
    return Math.round((articleData.credibilityScore / 2) * 10) / 10;
  }
  return null;
};

// Get source name from sourceId
const getSourceName = (sourceId: string) => {
  const sources: Record<string, string> = {
    '550e8400-e29b-41d4-a716-446655440001': 'Online Khabar',
    '550e8400-e29b-41d4-a716-446655440002': 'eKantipur',
    '550e8400-e29b-41d4-a716-446655440003': 'Setopati',
  };
  return sources[sourceId] || 'News Source';
};

export function ArticleCard({ article, variant = 'default', className }: ArticleCardProps) {
  const formattedDate = format(new Date(article.publishedAt), 'MMM dd, yyyy');
  const credibilityScore = getCredibilityScore(article);
  const credibilityStyle = credibilityScore ? getCredibilityStyle(credibilityScore) : null;
  const sourceName = getSourceName(article.sourceId);

  // Compact variant (sidebar/list)
  if (variant === 'compact') {
    return (
      <Link href={`/articles/${article.id}`} className={cn("block group h-full", className)}>
        <div className="flex gap-4 py-4 px-3 border-b border-border card-hover h-full">
          {article.imageUrl && (
            <div className="relative w-24 h-24 flex-shrink-0 overflow-hidden bg-muted rounded-md">
              <Image
                src={article.imageUrl}
                alt={article.title}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{sourceName}</span>
              {credibilityScore && credibilityStyle && (
                <span className={cn('px-2 py-0.5 text-[10px] font-bold rounded', credibilityStyle.class)}>
                  {credibilityScore}
                </span>
              )}
            </div>
            <h3 className="font-serif font-bold text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {article.title}
            </h3>
            <div className="text-xs text-muted-foreground">
              {formattedDate}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Grid/Vertical Card variant (Standard Tile)
  if (variant === 'grid' || variant === 'default') {
    // If variant is strictly 'grid', force vertical. If 'default' (legacy), check usage. 
    // Actually, let's make 'grid' always vertical (Image Top).
    const isVertical = variant === 'grid';

    // For legacy 'default' (row layout), we keep the implementation at the bottom.
    // BUT user wants to replace 'default' with grid likely.

    if (isVertical) {
      return (
        <Link href={`/articles/${article.id}`} className={cn("block group h-full", className)}>
          <article className="bg-card border border-border/50 rounded-lg overflow-hidden h-full flex flex-col transition-all hover:shadow-md">
            {article.imageUrl && (
              <div className="relative w-full aspect-video overflow-hidden bg-muted">
                <Image
                  src={article.imageUrl}
                  alt={article.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <div className="bg-background/90 backdrop-blur px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded">
                    {article.category}
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col flex-1 p-4">
              {/* Metadata */}
              <div className="flex items-center justify-between text-xs mb-2 text-muted-foreground">
                <span>{sourceName}</span>
                {credibilityScore && credibilityStyle && (
                  <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold', credibilityStyle.class)}>
                    {credibilityScore}
                  </span>
                )}
              </div>

              <h3 className="font-serif text-lg font-bold leading-tight mb-2 flex-grow group-hover:text-primary transition-colors line-clamp-3">
                {article.title}
              </h3>

              <div className="mt-auto pt-3 flex items-center justify-between text-xs text-muted-foreground border-t border-border/50">
                <span>{formattedDate}</span>
                {article.author && <span className="truncate max-w-[50%]">{article.author}</span>}
              </div>
            </div>
          </article>
        </Link>
      );
    }
  }

  // Featured Hero variant
  if (variant === 'featured') {
    return (
      <Link href={`/articles/${article.id}`} className={cn("block group h-full", className)}>
        <article className="bg-card h-full flex flex-col">
          {/* Top metadata bar */}
          <div className="flex items-center justify-between py-2 px-1 text-sm">
            <span className="text-muted-foreground">{sourceName}</span>
            <span className="font-bold uppercase tracking-widest text-primary">
              {article.category}
            </span>
          </div>

          {article.imageUrl && (
            <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden rounded-md">
              <Image
                src={article.imageUrl}
                alt={article.title}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="py-6">
            <h2 className="font-serif text-3xl md:text-5xl font-bold mb-4 leading-tight group-hover:text-primary transition-colors">
              {article.title}
            </h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{formattedDate}</span>
              {article.author && <span>| {article.author}</span>}
              <span>| {article.viewCount} views</span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  // Fallback / Default Row Layout (Legacy)
  // Used if variant='default' and we want to keep horizontal style in some places
  return (
    <Link href={`/articles/${article.id}`} className={cn("block group", className)}>
      <article className="bg-card border-b border-border pb-6 mb-6 card-hover">
        {/* Same as before... */}
        <div className="flex items-center justify-between py-2 mb-2 px-3 text-xs">
          <span className="text-muted-foreground">{sourceName}</span>
          <span className="font-bold uppercase tracking-widest text-primary">
            {article.category}
          </span>
          {credibilityScore && credibilityStyle && (
            <span className={cn('px-2 py-0.5 font-bold', credibilityStyle.class)}>
              AI Rating: {credibilityScore} ★
            </span>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {article.imageUrl && (
            <div className="relative w-full md:w-64 h-48 flex-shrink-0 overflow-hidden bg-muted rounded-md">
              <Image
                src={article.imageUrl}
                alt={article.title}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="flex-1 flex flex-col justify-center">
            <h3 className="font-serif text-2xl font-bold leading-tight group-hover:text-primary transition-colors mb-3">
              {article.title}
            </h3>
            <div className="text-sm text-muted-foreground">
              {formattedDate}
              {article.author && (
                <span> | {article.author}</span>
              )}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
