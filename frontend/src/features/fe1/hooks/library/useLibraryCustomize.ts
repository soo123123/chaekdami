import { useMemo, useState } from 'react';
import { readingApi } from '@/api/readingApi';
import { DEFAULT_THEME_ID, LIBRARY_THEMES } from '../../constants/options';
import type { ThemeCategory } from '../../types/reading';
import { toAppError } from '../../utils/apiError';
import { useAsyncResource } from '../common/useAsyncResource';

/**
 * 서재 테마 선택/저장.
 * - appliedThemeId: 서버에 저장된(적용 중인) 테마
 * - selectedTheme: 화면에서 고른 테마 (저장 전에는 미리보기만)
 * 저장 실패 시 적용 테마는 기존 값을 유지한다.
 */
export function useLibraryCustomize() {
  const [selectedCategory, setSelectedCategory] = useState<ThemeCategory>('all');
  const [pickedThemeId, setPickedThemeId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const { data: savedThemeId, setData: setSavedThemeId, error: loadError, isLoading, reload } =
    useAsyncResource(() => readingApi.getLibraryTheme(), []);

  const appliedThemeId = savedThemeId ?? DEFAULT_THEME_ID;
  const selectedThemeId = pickedThemeId ?? appliedThemeId;
  const selectedTheme = LIBRARY_THEMES.find(t => t.themeId === selectedThemeId) ?? LIBRARY_THEMES[0];

  const themes = useMemo(
    () => (selectedCategory === 'all' ? LIBRARY_THEMES : LIBRARY_THEMES.filter(t => t.category === selectedCategory)),
    [selectedCategory],
  );

  const selectTheme = (themeId: string) => {
    setPickedThemeId(themeId);
    setSaveError(null);
    setSaveMessage(null);
  };

  const saveTheme = async () => {
    if (selectedThemeId === appliedThemeId) return;
    setIsSaving(true);
    setSaveError(null);
    setSaveMessage(null);
    try {
      await readingApi.saveLibraryTheme(selectedThemeId);
      setSavedThemeId(selectedThemeId);
      setSaveMessage(`'${selectedTheme.name}' 테마를 적용했어요.`);
    } catch (e) {
      setSaveError(toAppError(e).message);
    } finally {
      setIsSaving(false);
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
    hasChanges: selectedThemeId !== appliedThemeId,
    setSelectedCategory,
    selectTheme,
    saveTheme,
    reload,
  };
}
