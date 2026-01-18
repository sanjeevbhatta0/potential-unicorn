import { Metadata } from 'next';
import { ArticleDetailClient } from './ArticleDetailClient';

interface ArticlePageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  // In a real app, you would fetch the article here for metadata
  return {
    title: 'Article Detail - NewsChautari',
    description: 'Read the full article on NewsChautari',
  };
}

export default function ArticlePage({ params }: ArticlePageProps) {
  return <ArticleDetailClient articleId={params.id} />;
}
