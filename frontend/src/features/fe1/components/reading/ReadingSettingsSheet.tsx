import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '../../constants/theme';
import type { ReadingSettingsUpdate, RegisteredBook } from '../../types/reading';
import { toAppError } from '../../utils/apiError';
import { todayIso } from '../../utils/format';
import { AppButton } from '../common/AppButton';
import { BottomSheetModal } from '../common/BottomSheetModal';
import { InlineError } from '../common/StateView';
import { PublicSetting } from './PublicSetting';
import { ReadingGoalSetting } from './ReadingGoalSetting';

type Props = {
  visible: boolean;
  book: RegisteredBook;
  /** 완독한 회차면 공개 설정만 바꿀 수 있다 */
  isCompleted: boolean;
  onClose: () => void;
  onSave: (settings: ReadingSettingsUpdate) => Promise<void>;
};

/**
 * 등록한 뒤 독서 목표·공개 설정 보기·수정 (TODO-32). 지금 회차에 저장한다.
 * - 현재 쪽은 세션 기록과 어긋날 수 있어 여기서 바꾸지 않는다.
 * - 서버는 보내지 않은(null) 값을 그대로 두므로, 이미 정한 목표를 지울 수는 없다.
 */
export function ReadingSettingsSheet({ visible, book, isCompleted, onClose, onSave }: Props) {
  const [isPublic, setIsPublic] = useState(book.isPublic);
  const [goalDate, setGoalDate] = useState(book.goalDate);
  const [goalPage, setGoalPage] = useState(book.goalPage);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 열 때마다 지금 값으로 다시 채운다
  const [openedFor, setOpenedFor] = useState<boolean>(false);
  if (visible !== openedFor) {
    setOpenedFor(visible);
    if (visible) {
      setIsPublic(book.isPublic);
      setGoalDate(book.goalDate);
      setGoalPage(book.goalPage);
      setError(null);
    }
  }

  const validate = (): string | null => {
    if (isCompleted) return null;
    if ((book.goalDate && !goalDate) || (book.goalPage && !goalPage)) return '이미 정한 목표는 지울 수 없어요. 다른 값으로 바꿔주세요.';
    if (goalDate && goalDate !== book.goalDate && goalDate < todayIso()) return '목표 날짜는 오늘 이후로 설정해주세요.';
    if (goalPage !== undefined && goalPage !== book.goalPage) {
      if (goalPage <= book.currentPage) return `목표 페이지는 현재 페이지(${book.currentPage}쪽)보다 커야 해요.`;
      if (book.totalPages && goalPage > book.totalPages) return '목표 페이지는 전체 페이지를 넘을 수 없어요.';
    }
    return null;
  };

  const handleSave = async () => {
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await onSave(isCompleted ? { isPublic } : { isPublic, goalDate, goalPage });
      onClose();
    } catch (e) {
      setError(toAppError(e).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BottomSheetModal visible={visible} title="독서 설정" onClose={onClose}>
      <View style={styles.body}>
        {!isCompleted ? (
          <ReadingGoalSetting
            goalDate={goalDate}
            goalPage={goalPage}
            currentPage={book.currentPage}
            totalPages={book.totalPages}
            onDateChange={setGoalDate}
            onPageChange={setGoalPage}
          />
        ) : null}
        <PublicSetting isPublic={isPublic} onChange={setIsPublic} />
        <InlineError message={error} />
        <AppButton onPress={() => void handleSave()} isLoading={isSaving}>저장하기</AppButton>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.md },
});
