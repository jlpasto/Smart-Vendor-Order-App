import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for implementing infinite scroll using Intersection Observer API
 *
 * @param {Object} options - Configuration options
 * @param {boolean} options.loading - Whether data is currently being loaded
 * @param {boolean} options.hasMore - Whether there are more items to load
 * @param {Function} options.onLoadMore - Callback function to load more data
 * @param {string} [options.rootMargin='100px'] - Margin around the root (how early to trigger load)
 * @param {number} [options.threshold=0] - Percentage of visibility needed to trigger (0-1)
 *
 * @returns {React.RefObject} observerTarget - Ref to attach to the sentinel element
 *
 * @example
 * const observerTarget = useInfiniteScroll({
 *   loading: isLoadingMore,
 *   hasMore: hasMoreData,
 *   onLoadMore: loadMoreProducts,
 *   rootMargin: '100px'
 * });
 *
 * // In JSX:
 * <div ref={observerTarget} />
 */
export const useInfiniteScroll = ({
  loading,
  hasMore,
  onLoadMore,
  rootMargin = '100px',
  threshold = 0
}) => {
  const observerTarget = useRef(null);

  const handleObserver = useCallback((entries) => {
    const [target] = entries;

    // Only trigger load if:
    // 1. Element is intersecting (visible)
    // 2. There are more items to load
    // 3. Not currently loading
    if (target.isIntersecting && hasMore && !loading) {
      onLoadMore();
    }
  }, [hasMore, loading, onLoadMore]);

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const options = {
      root: null, // Use viewport as root
      rootMargin, // Load before reaching the exact bottom
      threshold // 0 means trigger as soon as any part is visible
    };

    const observer = new IntersectionObserver(handleObserver, options);
    observer.observe(element);

    // Cleanup: unobserve when component unmounts or dependencies change
    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [handleObserver, rootMargin, threshold]);

  return observerTarget;
};

export default useInfiniteScroll;
