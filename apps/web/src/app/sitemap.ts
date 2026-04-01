import { MetadataRoute } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
const SITE_URL = 'https://newschautari.ai';

const CATEGORIES = [
  'politics', 'sports', 'entertainment', 'business',
  'technology', 'health', 'education', 'international',
  'opinion', 'general',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // Static pages
  entries.push({
    url: SITE_URL,
    lastModified: new Date(),
    changeFrequency: 'hourly',
    priority: 1.0,
  });

  // Category pages
  for (const category of CATEGORIES) {
    entries.push({
      url: `${SITE_URL}/?category=${category}`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    });
  }

  // Article pages - fetch recent articles
  try {
    const res = await fetch(`${API_URL}/api/v1/articles?limit=500&sortBy=publishedAt&sortOrder=desc`, {
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const json = await res.json();
      // API returns {success, data: {data: [...], pagination: {...}}}
      const wrapper = json.data || json;
      const articles = wrapper.data || wrapper;

      if (Array.isArray(articles)) {
        for (const article of articles) {
          entries.push({
            url: `${SITE_URL}/articles/${article.id}`,
            lastModified: new Date(article.updatedAt || article.publishedAt),
            changeFrequency: 'weekly',
            priority: 0.7,
          });
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch articles for sitemap:', error);
  }

  return entries;
}
