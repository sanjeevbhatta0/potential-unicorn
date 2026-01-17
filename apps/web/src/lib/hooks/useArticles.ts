import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Article, ArticleQueryParams } from '@potential-unicorn/types';
import { api } from '../api/client';

interface ArticlesResponse {
  data: Article[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Query keys
export const articleKeys = {
  all: ['articles'] as const,
  lists: () => [...articleKeys.all, 'list'] as const,
  list: (params?: ArticleQueryParams) => [...articleKeys.lists(), params] as const,
  details: () => [...articleKeys.all, 'detail'] as const,
  detail: (id: string) => [...articleKeys.details(), id] as const,
  trending: () => [...articleKeys.all, 'trending'] as const,
  search: (query: string) => [...articleKeys.all, 'search', query] as const,
};

// Fetch articles with filters
export function useArticles(params?: ArticleQueryParams) {
  return useQuery({
    queryKey: articleKeys.list(params),
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }
      return api.get<ArticlesResponse>(`/articles?${queryParams.toString()}`);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Fetch single article by ID
export function useArticle(id: string) {
  return useQuery({
    queryKey: articleKeys.detail(id),
    queryFn: () => api.get<Article>(`/articles/${id}`),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// Fetch trending articles
export function useTrendingArticles(limit: number = 10) {
  return useQuery({
    queryKey: articleKeys.trending(),
    queryFn: () =>
      api.get<Article[]>('/articles/trending', {
        params: { limit },
      }),
    staleTime: 1000 * 60 * 3, // 3 minutes
  });
}

// Search articles
export function useSearchArticles(query: string) {
  return useQuery({
    queryKey: articleKeys.search(query),
    queryFn: () =>
      api.get<ArticlesResponse>('/articles/search', {
        params: { q: query },
      }),
    enabled: query.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Increment view count mutation
export function useIncrementViewCount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (articleId: string) =>
      api.post(`/articles/${articleId}/view`),
    onSuccess: (_, articleId) => {
      // Invalidate article detail query to refetch with updated view count
      queryClient.invalidateQueries({ queryKey: articleKeys.detail(articleId) });
    },
  });
}
