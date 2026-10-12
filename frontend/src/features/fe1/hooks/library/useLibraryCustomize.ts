import { useMemo, useRef, useState } from 'react';
import { readingApi } from '@/features/fe1/api/readingApi';
import { DEFAULT_THEME_ID, LIBRARY_THEMES } from '../../constants/options';
import type { ThemeCategory } from '../../types/reading';
import { toAppError } from '../../utils/apiError';
import { useAsyncResource } from '../common/useAsyncResource';

/**
 * 서재 테마 선택/저장 (설계 문서: ThemeCard 선택 → 저장 요청).
 * - appliedThemeId: 서버에 저장된(적용 중인) 테마
 * - selectedTheme: 화면에서 고른 테마. 고르는 즉시 미리보기에 반영하고 저장을 요청한다.
 * - 저장 성공 시 적용 테마로 반영하고, 실패 시 기존 테마로 되돌린 뒤 오류를 표시한다.
 */
export function useLibraryCustomize() {
  const [selectedCategory, setSelectedCategory] = useState<ThemeCategory>('all');
  const [pickedThemeId, setPickedThemeId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const { data: savedThemeId, setData: setSavedThemeId, error: loadError, isLoading, reload } =
    useAsyncResource(() => readingApi.getLibraryTheme(), []);

  const appliedThemeId = savedThemeId ?? DEFAULT_THEME_ID;
  const selectedThemeId = pickedThemeId ?? appliedThemeId;
  const selectedTheme = LIBRARY_THEMES.find(t => t.themeId === selectedThemeId) ?? LIBRARY_THEMES[0];

  const themes = useMemo(
    () => (selectedCategory === 'all' ? LIBRARY_THEMES : LIBRARY_THEMES.filter(t => t.category === selectedCategory)),
    [selectedCategory],
  );

  /** 테마를 선택하고 바로 저장을 요청한다. 연달아 누르면 마지막 선택만 반영한다. */
  const selectTheme = async (themeId: string) => {
    setSaveError(null);
    setSaveMessage(null);
    if (themeId === appliedThemeId && !isSaving) {
      setPickedThemeId(null);
      return;
    }
    const requestId = ++requestIdRef.current;
    const theme = LIBRARY_THEMES.find(t => t.themeId === themeId);
    setPickedThemeId(themeId);
    setIsSaving(true);
    try {
      await readingApi.saveLibraryTheme(themeId);
      if (requestId !== requestIdRef.current) return;
      setSavedThemeId(themeId);
      setPickedThemeId(null);
      setSaveMessage(`'${theme?.name ?? '선택한'}' 테마를 적용했어요.`);
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      // 저장 실패 시 기존 테마 유지
      setPickedThemeId(null);
      setSaveError(toAppError(e).message);
    } finally {
      if (requestId === requestIdRef.current) setIsSaving(false);
    }
  };

  return {
    selectedCategory,
    selectedTheme,
    appliedThemeId,
    themes,
    isLoading,
    isSaving,
    loadError,
    saveError,
    saveMessage,
    setSelectedCategory,
    selectTheme,
    reload,
  };
}
