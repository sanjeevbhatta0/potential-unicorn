export interface CrawlerConfig {
  name: string;
  baseUrl: string;
  enabled: boolean;
  selectors: {
    articleList: string;
    articleLink: string;
    title: string;
    content: string;
    author?: string;
    publishDate?: string;
    category?: string;
    image?: string;
    tags?: string;
  };
  rateLimit: {
    requestsPerMinute: number;
    delayBetweenRequests: number; // milliseconds
  };
  pagination?: {
    enabled: boolean;
    maxPages?: number;
    nextPageSelector?: string;
    pageUrlPattern?: string;
  };
  usePlaywright?: boolean; // Use Playwright for dynamic content
}

export const crawlerConfigs: Record<string, CrawlerConfig> = {
  onlinekhabar: {
    name: 'Online Khabar',
    baseUrl: 'https://www.onlinekhabar.com',
    enabled: true,
    selectors: {
      articleList: 'article.ok-post, .ok-news-post',
      articleLink: 'a.ok-post-title-link, h2.ok-news-title a',
      title: 'h1.ok-news-title, h1.ok18-single-post-title',
      content: '.ok-news-post-content p, .ok18-single-post-content p',
      author: '.ok-author-name, .ok-news-author-name',
      publishDate: 'time.ok-news-post-date, .ok-news-date',
      category: '.ok-cat-name, .ok-news-category',
      image: 'img.ok-news-post-featured-image, .ok18-featured-image img',
      tags: '.ok-tags a, .ok-news-tags a'
    },
    rateLimit: {
      requestsPerMinute: 10,
      delayBetweenRequests: 6000
    },
    pagination: {
      enabled: true,
      maxPages: 5,
      pageUrlPattern: 'https://www.onlinekhabar.com/page/{page}'
    },
    usePlaywright: false
  },

  ekantipur: {
    name: 'eKantipur',
    baseUrl: 'https://ekantipur.com',
    enabled: true,
    selectors: {
      articleList: '.normal-news, article.card',
      articleLink: 'h2 a, h3 a, .article-title a',
      title: 'h1.article-title, h1.title',
      content: '.article-content p, .description p, .current-news-block p',
      author: '.author-name, .article-author',
      publishDate: '.article-date, time.date, .date',
      category: '.category, .article-category',
      image: '.featured-image img, .article-image img',
      tags: '.tags a, .article-tags a'
    },
    rateLimit: {
      requestsPerMinute: 10,
      delayBetweenRequests: 6000
    },
    pagination: {
      enabled: true,
      maxPages: 5,
      nextPageSelector: '.pagination .next'
    },
    usePlaywright: false
  },

  setopati: {
    name: 'Setopati',
    baseUrl: 'https://www.setopati.com',
    enabled: true,
    selectors: {
      articleList: '.news-box, article.news-item',
      articleLink: 'h2 a, h3 a, .news-title a',
      title: 'h1.news-title, h1',
      content: '.news-content p, #newsContent p',
      author: '.author, .news-author, .reporter-name',
      publishDate: '.date, .news-date, time',
      category: '.category, .news-category',
      image: '.featured-image img, .news-image img',
      tags: '.tags a, .news-tags a'
    },
    rateLimit: {
      requestsPerMinute: 10,
      delayBetweenRequests: 6000
    },
    pagination: {
      enabled: true,
      maxPages: 5,
      pageUrlPattern: 'https://www.setopati.com/page/{page}'
    },
    usePlaywright: false
  }
};

export default crawlerConfigs;
