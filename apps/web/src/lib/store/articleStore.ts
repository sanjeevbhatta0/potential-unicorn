import { create } from 'zustand';
import { Article, Category } from '@potential-unicorn/types';

interface ArticleFilters {
  category?: Category;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  isTrending?: boolean;
}

interface ArticleState {
  // State
  selectedArticle: Article | null;
  filters: ArticleFilters;
  bookmarkedArticles: string[]; // Array of article IDs

  // Actions
  setSelectedArticle: (article: Article | null) => void;
  setFilters: (filters: Partial<ArticleFilters>) => void;
  resetFilters: () => void;
  toggleBookmark: (articleId: string) => void;
  isBookmarked: (articleId: string) => boolean;
}

export const useArticleStore = create<ArticleState>()((set, get) => ({
  selectedArticle: null,
  filters: {},
  bookmarkedArticles: [],

  setSelectedArticle: (article) =>
    set({ selectedArticle: article }),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  resetFilters: () =>
    set({ filters: {} }),

  toggleBookmark: (articleId) =>
    set((state) => {
      const isCurrentlyBookmarked = state.bookmarkedArticles.includes(articleId);
      return {
        bookmarkedArticles: isCurrentlyBookmarked
          ? state.bookmarkedArticles.filter((id) => id !== articleId)
          : [...state.bookmarkedArticles, articleId],
      };
    }),

  isBookmarked: (articleId) =>
    get().bookmarkedArticles.includes(articleId),
}));
