import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FE1_ROUTES } from '../../constants/routes';
import { formatDuration } from '../../utils/format';
import { clearReadingDraft, draftSeconds, loadReadingDraft, type ReadingDraft } from '../../utils/readingDraft';
import { ConfirmModal } from '../common/BottomSheetModal';

/** '나중에'로 닫으면 앱을 다시 켤 때까지 묻지 않는다 */
let isDismissedThisRun = false;

/**
 * 저장하지 못한 독서 기록이 기기에 남아 있으면 이어서 할지 묻는다 (ISSUE-LIMIT-2, ASK-17).
 * 앱이 종료되거나 로그인이 끊겨 독서 화면을 벗어난 뒤, 서재에 들어오면 보인다.
 * - 이어서 하기: 재던 시간이면 독서 시작 화면(일시정지 상태), 입력하던 기록이면 독서 종료 화면으로 간다.
 * - 버리기: 보관한 기록을 지운다.
 * - 바깥을 누르면(나중에) 기록은 남겨 두고 이번 실행에서는 다시 묻지 않는다.
 */
export function ReadingDraftPrompt() {
  const [draft, setDraft] = useState<ReadingDraft | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (isDismissedThisRun) return;
      let active = true;
      void loadReadingDraft().then(found => {
        if (active) setDraft(found);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  if (!draft) return null;

  const seconds = draftSeconds(draft);
  const message = draft.kind === 'timer'
    ? `『${draft.bookTitle}』을 ${formatDuration(seconds)} 읽던 기록이 남아 있어요. 이어서 읽을까요?`
    : `『${draft.bookTitle}』의 ${formatDuration(seconds)} 독서 기록을 아직 저장하지 않았어요. 이어서 저장할까요?`;

  const resume = () => {
    const bookId = String(draft.bookId);
    setDraft(null);
    if (draft.kind === 'timer') router.push({ pathname: FE1_ROUTES.readingStart, params: { bookId } });
    else router.push({ pathname: FE1_ROUTES.readingEnd, params: { bookId, elapsedTime: String(draft.elapsedTime) } });
  };

  const discard = () => {
    void clearReadingDraft(draft.bookId);
    setDraft(null);
  };

  return (
    <ConfirmModal
      visible
      title="읽던 기록이 있어요"
      message={message}
      confirmLabel="이어서 하기"
      cancelLabel="버리기"
      onConfirm={resume}
      onCancel={discard}
      onDismiss={() => {
        isDismissedThisRun = true;
        setDraft(null);
      }}
    />
  );
}
