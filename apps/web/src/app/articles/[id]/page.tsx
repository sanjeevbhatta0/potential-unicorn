import { Metadata } from 'next';
import { ArticleDetailClient } from './ArticleDetailClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

interface ArticlePageProps {
  params: {
    id: string;
  };
}

async function getArticle(id: string) {
  try {
    const res = await fetch(`${API_URL}/api/v1/articles/${id}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || json;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const article = await getArticle(params.id);

  if (!article) {
    return {
      title: 'Article Not Found - NewsChautari.ai',
      description: 'The article you are looking for could not be found.',
    };
  }

  const title = article.seoTitle || article.title;
  const description = article.seoDescription || article.aiSummary || article.summary || article.content?.substring(0, 155);
  const keywords = article.seoKeywords?.length ? article.seoKeywords : article.tags;

  // Build JSON-LD for head injection
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title,
    description,
    image: article.imageUrl || undefined,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: {
      '@type': article.author ? 'Person' : 'Organization',
      name: article.author || article.source?.name || 'NewsChautari.ai',
    },
    publisher: {
      '@type': 'Organization',
      name: 'NewsChautari.ai',
      logo: { '@type': 'ImageObject', url: 'https://newschautari.ai/logo.png' },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://newschautari.ai/articles/${article.id}` },
    articleSection: article.category,
    inLanguage: article.language === 'ne' ? 'ne-NP' : 'en',
    keywords: keywords?.join(', '),
    wordCount: article.content?.split(/\s+/).length || 0,
  };

  return {
    title,
    description,
    keywords: keywords?.join(', '),
    authors: article.author ? [{ name: article.author }] : undefined,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: article.author ? [article.author] : undefined,
      tags: article.tags,
      images: article.imageUrl ? [{ url: article.imageUrl, alt: title }] : undefined,
      url: `https://newschautari.ai/articles/${article.id}`,
      siteName: 'NewsChautari.ai',
    },
    twitter: {
      card: article.imageUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      images: article.imageUrl ? [article.imageUrl] : undefined,
    },
    alternates: {
      canonical: `https://newschautari.ai/articles/${article.id}`,
    },
    robots: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const article = await getArticle(params.id);

  const title = article?.seoTitle || article?.title;
  const description = article?.seoDescription || article?.aiSummary || article?.summary;
  const keywords = article?.seoKeywords?.length ? article.seoKeywords : article?.tags;

  // JSON-LD structured data for search engines and LLMs
  const jsonLd = article ? {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title,
    description,
    image: article.imageUrl || undefined,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: {
      '@type': article.author ? 'Person' : 'Organization',
      name: article.author || article.source?.name || 'NewsChautari.ai',
    },
    publisher: {
      '@type': 'Organization',
      name: 'NewsChautari.ai',
      logo: { '@type': 'ImageObject', url: 'https://newschautari.ai/logo.png' },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://newschautari.ai/articles/${article.id}` },
    articleSection: article.category,
    inLanguage: article.language === 'ne' ? 'ne-NP' : 'en',
    keywords: keywords?.join(', '),
    wordCount: article.content?.split(/\s+/).length || 0,
  } : null;

  const breadcrumbLd = article ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://newschautari.ai' },
      { '@type': 'ListItem', position: 2, name: article.category?.charAt(0).toUpperCase() + article.category?.slice(1), item: `https://newschautari.ai/?category=${article.category}` },
      { '@type': 'ListItem', position: 3, name: title },
    ],
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {breadcrumbLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />
      )}
      <ArticleDetailClient articleId={params.id} />
    </>
  );
}
