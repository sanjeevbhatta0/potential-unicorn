import { useEffect, useRef, RefObject } from 'react';

interface UseInfiniteScrollOptions {
  threshold?: number;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
}

/**
 * Hook to detect when user scrolls near the bottom of an element
 * and trigger loading more content
 */
export function useInfiniteScroll({
  threshold = 100,
  hasMore,
  isLoading,
  onLoadMore,
}: UseInfiniteScrollOptions): RefObject<HTMLDivElement> {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      // If user is close to bottom and we have more data and not currently loading
      if (distanceFromBottom < threshold && hasMore && !isLoading) {
        onLoadMore();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [threshold, hasMore, isLoading, onLoadMore]);

  return containerRef;
}

/**
 * Hook for infinite scroll using window scroll
 */
export function useWindowInfiniteScroll({
  threshold = 100,
  hasMore,
  isLoading,
  onLoadMore,
}: UseInfiniteScrollOptions) {
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      if (distanceFromBottom < threshold && hasMore && !isLoading) {
        onLoadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold, hasMore, isLoading, onLoadMore]);
}
