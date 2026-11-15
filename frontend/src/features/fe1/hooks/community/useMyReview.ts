import { useCallback, useEffect, useState } from 'react';
import { showToast } from '@/components/Toast';
import { COMMUNITY_ERROR_CODES, communityApi } from '@/features/fe1/api/communityApi';
import type { BookId } from '../../types/reading';
import { toAppError } from '../../utils/apiError';
import { useAsyncResource } from '../common/useAsyncResource';

export const ONE_LINE_MAX_LENGTH = 100;

/** 한줄평 입력값 정리: 줄바꿈은 공백으로 바꾸고 최대 길이로 자른다 (서버는 줄바꿈 불가) */
export function sanitizeOneLine(text: string): string {
  return text.replace(/[\r\n]+/g, ' ').slice(0, ONE_LINE_MAX_LENGTH);
}

/**
 * 선택한 책의 내 리뷰(별점 + 한줄평 + 스포일러) 조회·작성·수정.
 * - 리뷰가 없으면 작성 폼을, 있으면 '내 한줄평' 카드를 보여주고 수정 버튼으로 폼을 연다.
 * - 저장에 성공하면 onSaved(통계·목록 새로고침)를 호출한다.
 */
export function useMyReview(bookId: BookId | null, onSaved?: () => void) {
  const { data: loaded, setData, isLoading, error, reload } = useAsyncResource(
    () => communityApi.getMyReview(bookId!),
    [bookId],
    { enabled: !!bookId },
  );

  // 책을 바꾼 직후에는 이전 책의 응답이 남아 있으므로 bookId가 같을 때만 내 리뷰로 본다
  const myReview = loaded && loaded.bookId === bookId ? loaded : null;
  const isReady = !isLoading && (!loaded || loaded.bookId === bookId || error !== null);

  const [rating, setRating] = useState(0);
  const [oneLine, setOneLineRaw] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setRating(0);
    setOneLineRaw('');
    setIsSpoiler(false);
    setFormError(null);
  }, []);

  // 책을 바꾸면 입력 중이던 내용을 비운다
  useEffect(() => {
    resetForm();
    setIsEditing(false);
  }, [bookId, resetForm]);

  const setOneLine = (text: string) => {
    setOneLineRaw(sanitizeOneLine(text));
    setFormError(null);
  };

  const startEdit = () => {
    if (!myReview) return;
    setRating(myReview.rating);
    setOneLineRaw(myReview.oneLine ?? '');
    setIsSpoiler(myReview.isSpoiler);
    setFormError(null);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    resetForm();
    setIsEditing(false);
  };

  const submit = async (): Promise<boolean> => {
    if (!bookId || isSaving) return false;
    if (rating < 1) {
      setFormError('별점을 선택해주세요.');
      return false;
    }
    const content = oneLine.trim();
    setIsSaving(true);
    setFormError(null);
    try {
      const request = { rating, oneLine: content, isSpoiler: content ? isSpoiler : false };
      const saved = myReview
        ? await communityApi.updateReview(myReview.reviewId, request)
        : await communityApi.createReview(bookId, request);
      setData(saved);
      resetForm();
      setIsEditing(false);
      showToast(myReview ? '한줄평을 수정했어요.' : '한줄평을 등록했어요.');
      onSaved?.();
      return true;
    } catch (e) {
      const appError = toAppError(e);
      if (appError.code === COMMUNITY_ERROR_CODES.reviewAlreadyExists) {
        // 다른 기기 등에서 이미 작성됨 → 내 리뷰를 다시 불러와 수정 모드로 안내
        await reload();
        setFormError('이미 이 책에 남긴 한줄평이 있어요. 수정하기로 내용을 바꿀 수 있어요.');
      } else if (appError.code === COMMUNITY_ERROR_CODES.readingNotCompleted) {
        setFormError('완독한 책에만 한줄평을 남길 수 있어요.');
      } else {
        setFormError(appError.message);
      }
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  /** 한줄평만 지운다 (별점은 남음). 서버 계약: oneLine: "" */
  const clearOneLine = async (): Promise<boolean> => {
    if (!myReview || isSaving) return false;
    setIsSaving(true);
    try {
      const saved = await communityApi.updateReview(myReview.reviewId, { oneLine: '', isSpoiler: false });
      setData(saved);
      showToast('한줄평을 지웠어요. 별점은 그대로 남아요.');
      onSaved?.();
      return true;
    } catch (e) {
      showToast(toAppError(e).message, 'error');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    myReview,
    isLoading: !isReady,
    error,
    reload,
    /** 폼을 보여줄지: 리뷰가 없거나 수정 중 */
    isFormOpen: !myReview || isEditing,
    isEditing,
    rating,
    setRating: (value: number) => { setRating(value); setFormError(null); },
    oneLine,
    setOneLine,
    isSpoiler,
    setIsSpoiler,
    isSaving,
    formError,
    startEdit,
    cancelEdit,
    submit,
    clearOneLine,
  };
}
