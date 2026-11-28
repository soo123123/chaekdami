import { useCallback, useEffect, useRef, useState } from 'react';
import { showToast } from '@/components/Toast';
import { COMMUNITY_ERROR_CODES, communityApi } from '@/features/fe1/api/communityApi';
import type {
  CommunityEntry,
  CommunityEntryDetail,
  CommunitySummary,
  ContentReportTarget,
  ReviewReportRequest,
} from '../../types/community';
import type { BookId } from '../../types/reading';
import { toAppError, type AppError } from '../../utils/apiError';

const PAGE_SIZE = 10;

/** 신고 실패 문구. 서버 문구보다 짧고 상황에 맞게 바꾼다 */
function reportErrorMessage(error: AppError): string {
  switch (error.code) {
    case COMMUNITY_ERROR_CODES.alreadyReported:
      return '이미 신고한 글이에요.';
    case COMMUNITY_ERROR_CODES.cannotReportOwnContent:
      return '내 글은 신고할 수 없어요.';
    case COMMUNITY_ERROR_CODES.tooManyAttempts:
      return '오늘은 더 신고할 수 없어요. 내일 다시 시도해주세요.';
    default:
      return error.message;
  }
}

/** 신고한 글을 내 화면에서 바로 숨긴다 (서버는 3건이 쌓여야 가린다) */
function withoutReported(entry: CommunityEntry, target: ContentReportTarget): CommunityEntry {
  if (target.kind === 'bookReport') {
    return entry.bookReport?.bookReportId === target.bookReportId ? { ...entry, bookReport: null } : entry;
  }
  if (!entry.sentenceCollection) return entry;
  const previewSentences = entry.sentenceCollection.previewSentences.filter(s => s.sentenceId !== target.sentenceId);
  return { ...entry, sentenceCollection: { ...entry.sentenceCollection, previewSentences } };
}

function detailWithoutReported(detail: CommunityEntryDetail, target: ContentReportTarget): CommunityEntryDetail {
  if (target.kind === 'bookReport') {
    return detail.bookReport?.bookReportId === target.bookReportId ? { ...detail, bookReport: null } : detail;
  }
  if (!detail.sentenceCollection) return detail;
  const days = detail.sentenceCollection.days
    .map(day => ({ ...day, sentences: day.sentences.filter(s => s.sentenceId !== target.sentenceId) }))
    .filter(day => day.sentences.length > 0);
  return { ...detail, sentenceCollection: { ...detail.sentenceCollection, days } };
}

/**
 * 완독자 커뮤니티: 같은 책을 완독한 다른 독자가 공개한 문장 모음집·독후감 (TODO-13, TODO-35).
 * - 요약은 잠겨 있어도 받는다. 열려 있을 때만 항목 목록을 부른다.
 * - 책을 바꾸면 목록·상세를 비우고 처음부터 다시 부른다. 늦게 온 응답은 요청 번호로 버린다.
 * - 독후감·문장을 신고하면 내 화면에서 바로 숨긴다.
 */
export function useCommunityEntries(bookId: BookId | null) {
  const [summary, setSummary] = useState<CommunitySummary | null>(null);
  const [entries, setEntries] = useState<CommunityEntry[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const requestIdRef = useRef(0);

  const [detail, setDetail] = useState<CommunityEntryDetail | null>(null);
  const [openedEntry, setOpenedEntry] = useState<CommunityEntry | null>(null);
  const [detailError, setDetailError] = useState<AppError | null>(null);
  const detailRequestRef = useRef(0);

  // 책을 바꾸면 이전 책의 값을 비운다 (렌더 중에 맞춤)
  const [lastBookId, setLastBookId] = useState(bookId);
  if (bookId !== lastBookId) {
    setLastBookId(bookId);
    setSummary(null);
    setEntries([]);
    setHasNext(false);
    setPage(0);
    setError(null);
    setOpenedEntry(null);
    setDetail(null);
  }

  const load = useCallback(async () => {
    if (bookId === null) return;
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setIsLoadingMore(false);
    setError(null);
    try {
      const nextSummary = await communityApi.getCommunitySummary(bookId);
      if (requestId !== requestIdRef.current) return;
      setSummary(nextSummary);
      if (!nextSummary.available || !nextSummary.unlocked) {
        setEntries([]);
        setHasNext(false);
        return;
      }
      const first = await communityApi.getCommunityEntries(bookId, 0, PAGE_SIZE);
      if (requestId !== requestIdRef.current) return;
      setEntries(first.items);
      setPage(0);
      setHasNext(first.hasNext);
    } catch (e) {
      if (requestId === requestIdRef.current) setError(toAppError(e));
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    // 서버 조회는 effect가 맡는 외부 동기화라 의도한 동작이다 (조회 시작 때 로딩 표시를 바로 켠다, TODO-45)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const loadMore = useCallback(async () => {
    if (bookId === null || !hasNext || isLoading || isLoadingMore) return;
    const requestId = requestIdRef.current;
    setIsLoadingMore(true);
    try {
      const next = await communityApi.getCommunityEntries(bookId, page + 1, PAGE_SIZE);
      if (requestId !== requestIdRef.current) return;
      setEntries(prev => {
        const seen = new Set(prev.map(entry => entry.readingRecordId));
        return [...prev, ...next.items.filter(entry => !seen.has(entry.readingRecordId))];
      });
      setPage(next.page);
      setHasNext(next.hasNext);
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      setHasNext(false);
      showToast(toAppError(e).message, 'error');
    } finally {
      if (requestId === requestIdRef.current) setIsLoadingMore(false);
    }
  }, [bookId, hasNext, isLoading, isLoadingMore, page]);

  const openEntry = useCallback(async (entry: CommunityEntry) => {
    if (bookId === null) return;
    const requestId = ++detailRequestRef.current;
    setOpenedEntry(entry);
    setDetail(null);
    setDetailError(null);
    try {
      const loaded = await communityApi.getCommunityEntry(bookId, entry.readingRecordId);
      if (requestId === detailRequestRef.current) setDetail(loaded);
    } catch (e) {
      if (requestId === detailRequestRef.current) setDetailError(toAppError(e));
    }
  }, [bookId]);

  const closeEntry = useCallback(() => {
    detailRequestRef.current += 1;
    setOpenedEntry(null);
    setDetail(null);
    setDetailError(null);
  }, []);

  const report = useCallback(async (target: ContentReportTarget, request: ReviewReportRequest): Promise<boolean> => {
    try {
      await communityApi.reportContent(target, request);
      showToast('신고가 접수되었어요.');
      setEntries(prev => prev.map(entry => withoutReported(entry, target)));
      setDetail(prev => (prev ? detailWithoutReported(prev, target) : prev));
      return true;
    } catch (e) {
      showToast(reportErrorMessage(toAppError(e)), 'error');
      return false;
    }
  }, []);

  return {
    summary,
    entries,
    hasNext,
    isLoading,
    isLoadingMore,
    error,
    reload: load,
    loadMore,
    openedEntry,
    detail,
    detailError,
    openEntry,
    closeEntry,
    report,
  };
}
