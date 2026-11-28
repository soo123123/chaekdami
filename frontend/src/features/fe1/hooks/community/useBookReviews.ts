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
  /** 더 불러오기가 실패하면 스크롤로 다시 요청하지 않고, '다시 불러오기'를 눌러야 다시 시도한다 (실패 토스트가 연달아 뜨지 않게) */
  const [hasLoadMoreError, setHasLoadMoreError] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const requestIdRef = useRef(0);
  /** 좋아요 요청 중인 리뷰 (연타 방지) */
  const likingRef = useRef(new Set<ReviewId>());

  const loadFirstPage = useCallback(async () => {
    if (!isbn) return;
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    // 더 불러오기 도중 정렬·책이 바뀌면 그 요청은 결과를 버리므로 로딩 해제도 여기서 한다 (ISSUE-BUG-22)
    setIsLoadingMore(false);
    setHasLoadMoreError(false);
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

  // 책·정렬이 바뀌면 이전 목록을 비운다 (렌더 중에 맞춤). 조회는 아래 effect가 한다.
  const queryKey = `${isbn ?? ''}|${sort}`;
  const [lastQueryKey, setLastQueryKey] = useState(queryKey);
  if (queryKey !== lastQueryKey) {
    setLastQueryKey(queryKey);
    setItems([]);
    setHasNext(false);
    setTotalElements(0);
  }

  useEffect(() => {
    // 서버 조회는 effect가 맡는 외부 동기화라 의도한 동작이다 (조회 시작 때 로딩 표시를 바로 켠다, TODO-45)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadFirstPage();
  }, [loadFirstPage]);

  const loadMore = useCallback(async ({ retry = false }: { retry?: boolean } = {}) => {
    if (!isbn || !hasNext || isLoading || isLoadingMore || (hasLoadMoreError && !retry)) return;
    const requestId = requestIdRef.current;
    setIsLoadingMore(true);
    setHasLoadMoreError(false);
    try {
      const result = await communityApi.getReviews({ isbn, sort, page: page + 1, size: PAGE_SIZE });
      if (requestId !== requestIdRef.current) return;
      // 새로 작성된 리뷰로 페이지가 밀려 중복될 수 있어 reviewId로 거른다
      setItems(prev => [...prev, ...result.items.filter(item => !prev.some(p => p.reviewId === item.reviewId))]);
      setPage(result.page);
      setHasNext(result.hasNext);
      setTotalElements(result.totalElements);
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      setHasLoadMoreError(true);
      showToast(toAppError(e).message, 'error');
    } finally {
      if (requestId === requestIdRef.current) setIsLoadingMore(false);
    }
  }, [isbn, sort, page, hasNext, isLoading, isLoadingMore, hasLoadMoreError]);

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
    hasLoadMoreError,
    error,
    reloadReviews: loadFirstPage,
    loadMore,
    toggleLike,
    report,
    refresh,
  };
}
