import { useCallback, useEffect, useRef, useState } from 'react';
import { showToast } from '@/components/Toast';
import { communityApi } from '@/features/fe1/api/communityApi';
import type { PublicReview, ReviewId, ReviewReportRequest, ReviewSort } from '../../types/community';
import { toAppError, type AppError } from '../../utils/apiError';
import { useAsyncResource } from '../common/useAsyncResource';

const PAGE_SIZE = 20;

/**
 * 한 책(ISBN)의 별점 통계 + 한줄평 목록(정렬·다음 페이지) + 좋아요·신고.
 * isbn이 바뀌면 정렬은 유지하고 첫 페이지부터 다시 불러온다.
 */
export function useBookReviews(isbn: string | null) {
  const summary = useAsyncResource(() => communityApi.getRatingSummary(isbn!), [isbn], { enabled: !!isbn });

  const [sort, setSort] = useState<ReviewSort>('latest');
  const [items, setItems] = useState<PublicReview[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const requestIdRef = useRef(0);
  /** 좋아요 요청 중인 리뷰 (연타 방지) */
  const likingRef = useRef(new Set<ReviewId>());

  const loadFirstPage = useCallback(async () => {
    if (!isbn) return;
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const result = await communityApi.getReviews({ isbn, sort, page: 0, size: PAGE_SIZE });
      if (requestId !== requestIdRef.current) return;
      setItems(result.items);
      setPage(result.page);
      setHasNext(result.hasNext);
      setTotalElements(result.totalElements);
    } catch (e) {
      if (requestId === requestIdRef.current) setError(toAppError(e));
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, [isbn, sort]);

  useEffect(() => {
    setItems([]);
    setHasNext(false);
    setTotalElements(0);
    void loadFirstPage();
  }, [loadFirstPage]);

  const loadMore = useCallback(async () => {
    if (!isbn || !hasNext || isLoading || isLoadingMore) return;
    const requestId = requestIdRef.current;
    setIsLoadingMore(true);
    try {
      const result = await communityApi.getReviews({ isbn, sort, page: page + 1, size: PAGE_SIZE });
      if (requestId !== requestIdRef.current) return;
      // 새로 작성된 리뷰로 페이지가 밀려 중복될 수 있어 reviewId로 거른다
      setItems(prev => [...prev, ...result.items.filter(item => !prev.some(p => p.reviewId === item.reviewId))]);
      setPage(result.page);
      setHasNext(result.hasNext);
      setTotalElements(result.totalElements);
    } catch (e) {
      if (requestId === requestIdRef.current) showToast(toAppError(e).message, 'error');
    } finally {
      if (requestId === requestIdRef.current) setIsLoadingMore(false);
    }
  }, [isbn, sort, page, hasNext, isLoading, isLoadingMore]);

  const patchItem = (reviewId: ReviewId, patch: Partial<PublicReview>) =>
    setItems(prev => prev.map(item => (item.reviewId === reviewId ? { ...item, ...patch } : item)));

  /** 좋아요 토글. 화면에 먼저 반영하고 실패하면 되돌린다. */
  const toggleLike = useCallback(async (review: PublicReview) => {
    if (review.isMine || likingRef.current.has(review.reviewId)) return;
    likingRef.current.add(review.reviewId);
    const nextLiked = !review.isLiked;
    patchItem(review.reviewId, { isLiked: nextLiked, likeCount: Math.max(0, review.likeCount + (nextLiked ? 1 : -1)) });
    try {
      const result = nextLiked ? await communityApi.like(review.reviewId) : await communityApi.unlike(review.reviewId);
      patchItem(review.reviewId, { isLiked: result.liked, likeCount: result.likeCount });
    } catch (e) {
      patchItem(review.reviewId, { isLiked: review.isLiked, likeCount: review.likeCount });
      showToast(toAppError(e).message, 'error');
    } finally {
      likingRef.current.delete(review.reviewId);
    }
  }, []);

  /** 신고. 성공 여부를 돌려준다. */
  const report = useCallback(async (reviewId: ReviewId, request: ReviewReportRequest): Promise<boolean> => {
    try {
      await communityApi.report(reviewId, request);
      showToast('신고가 접수되었어요.');
      return true;
    } catch (e) {
      showToast(toAppError(e).message, 'error');
      return false;
    }
  }, []);

  /** 내 리뷰 작성·수정 후 통계와 목록을 새로 고친다 */
  const reloadSummary = summary.reload;
  const refresh = useCallback(() => {
    void reloadSummary();
    void loadFirstPage();
  }, [reloadSummary, loadFirstPage]);

  return {
    summary: summary.data,
    isSummaryLoading: summary.isLoading,
    summaryError: summary.error,
    reloadSummary,
    sort,
    setSort,
    reviews: items,
    totalElements,
    hasNext,
    isLoading,
    isLoadingMore,
    error,
    reloadReviews: loadFirstPage,
    loadMore,
    toggleLike,
    report,
    refresh,
  };
}
