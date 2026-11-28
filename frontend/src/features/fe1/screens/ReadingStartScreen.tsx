import { router, useNavigation } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, View } from 'react-native';
import { BookInfo } from '../components/book/BookInfo';
import { Icon } from '../components/common/Icon';
import { ConfirmModal } from '../components/common/BottomSheetModal';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { ErrorView, LoadingView } from '../components/common/StateView';
import { FOCUS_MODE_BACKGROUND, FocusModeView } from '../components/reading/FocusModeView';
import { ReadingProgress } from '../components/reading/ReadingProgress';
import { ReadingStage } from '../components/reading/ReadingStage';
import { ReadingTimeSummary } from '../components/reading/ReadingTimeSummary';
import { FinishReadingButton, FocusModeButton, PauseButton, ReadingTimer } from '../components/reading/TimerControls';
import { MIN_READING_SECONDS } from '../constants/config';
import { showToast } from '@/components/Toast';
import { toBookDetail } from '@/constants/routes';
import { FE1_ROUTES } from '../constants/routes';
import { colors, radius, softShadow, spacing } from '../constants/theme';
import { useBookIdParam } from '../hooks/common/useRouteParams';
import { useReadingSession } from '../hooks/reading/useReadingSession';
import { useReadingTimer } from '../hooks/reading/useReadingTimer';
import { goBackOr } from '@/utils/navigation';
import { clearReadingDraft, draftSeconds, loadReadingDraft, saveReadingDraft, type ReadingDraft } from '../utils/readingDraft';
import { formatDuration } from '../utils/format';

/** 독서 중 시간을 기기에 보관하는 간격. 앱이 갑자기 꺼지면 마지막 보관 시각까지만 인정한다 (ISSUE-LIMIT-2) */
const DRAFT_SAVE_INTERVAL_MS = 30_000;

export function ReadingStartScreen() {
  const bookId = useBookIdParam();
  const session = useReadingSession(bookId);
  const timer = useReadingTimer();
  const navigation = useNavigation();
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);
  /** 다른 책이거나 종료 화면에서 저장하지 않은 기록. 새로 읽으면 덮어쓰므로 시작 전에 묻는다 */
  const [pendingDraft, setPendingDraft] = useState<ReadingDraft | null>(null);
  const allowLeaveRef = useRef(false);
  const { book } = session;
  const { startTimer, pauseTimer, finishReading, restoreTimer, getSnapshot, hasReachedLimit } = timer;

  // 책 정보 조회 성공 시 독서(타이머)를 시작한다.
  // 이 책을 읽던 시간이 기기에 남아 있으면(앱 종료·로그인 끊김) 그 시간에서 일시정지 상태로 이어간다 (ISSUE-LIMIT-2).
  const hasStartedRef = useRef(false);
  const bookTitle = book?.title;
  useEffect(() => {
    if (!book || hasStartedRef.current) return;
    hasStartedRef.current = true;
    // 책 정보를 다시 받아도(book이 바뀌어도) 한 번만 실행되므로 취소하지 않는다
    void loadReadingDraft().then(draft => {
      if (draft?.kind === 'timer' && draft.bookId === book.bookId) {
        restoreTimer(draftSeconds(draft));
        showToast(`읽던 시간(${formatDuration(draftSeconds(draft))})을 불러왔어요. '이어서 읽기'를 눌러주세요.`);
      } else if (draft) {
        // 보관은 한 건뿐이라 새로 읽으면 이 기록이 지워진다. 타이머를 켜지 않고 먼저 묻는다
        setPendingDraft(draft);
      } else {
        startTimer();
      }
    });
  }, [book, startTimer, restoreTimer]);

  // 재던 시간을 기기에 보관한다. 시작·일시정지 때 바로, 읽는 중에는 30초마다.
  const saveTimerDraft = useCallback(() => {
    if (bookId === null || !bookTitle || !hasStartedRef.current || allowLeaveRef.current) return;
    const snapshot = getSnapshot();
    if (snapshot.accumulatedMs === 0 && snapshot.runningSince === null) return;
    void saveReadingDraft({ kind: 'timer', bookId, bookTitle, ...snapshot, lastSeenAt: Date.now() });
  }, [bookId, bookTitle, getSnapshot]);
  useEffect(() => {
    saveTimerDraft();
    if (!timer.isRunning) return;
    const id = setInterval(saveTimerDraft, DRAFT_SAVE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [timer.isRunning, saveTimerDraft]);

  // 2시간에 닿으면 타이머가 멈춘다. 서버가 더 긴 기록을 받지 않으므로 종료하고 저장하도록 안내한다 (ISSUE-LIMIT-5).
  useEffect(() => {
    if (hasReachedLimit) showToast('한 번에 최대 2시간까지 기록할 수 있어요. 독서를 종료하고 저장해주세요.');
  }, [hasReachedLimit]);

  // 앱을 나가면(홈 화면·다른 앱으로 전환, 화면 잠금) 타이머를 일시정지한다.
  // 타이머는 시각 기준으로 계산하므로, 멈추지 않으면 앱 밖에 있던 시간까지 독서 시간에 더해진다.
  // 돌아와도 자동으로 다시 시작하지 않고 '이어서 읽기'를 눌러야 재개된다.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'background') pauseTimer();
    });
    return () => subscription.remove();
  }, [pauseTimer]);

  // 기록 없이 화면을 벗어나려 하면 확인한다 (뒤로가기 제스처/하드웨어 버튼 포함).
  useEffect(() => {
    return navigation.addListener('beforeRemove', event => {
      if (allowLeaveRef.current || !hasStartedRef.current) return;
      event.preventDefault();
      setIsLeaveConfirmOpen(true);
    });
  }, [navigation]);

  /** 남아 있던 기록으로 간다: 재던 시간이면 그 책의 독서 시작, 입력하던 기록이면 독서 종료 화면 */
  const resumePendingDraft = () => {
    if (!pendingDraft) return;
    const draft = pendingDraft;
    setPendingDraft(null);
    allowLeaveRef.current = true;
    const params = { bookId: String(draft.bookId) };
    if (draft.kind === 'timer') router.replace({ pathname: FE1_ROUTES.readingStart, params });
    else router.replace({ pathname: FE1_ROUTES.readingEnd, params: { ...params, elapsedTime: String(draft.elapsedTime) } });
  };

  /** 남아 있던 기록을 지우고 이 책을 새로 읽는다 */
  const discardPendingDraft = () => {
    setPendingDraft(null);
    void clearReadingDraft();
    startTimer();
  };

  const handleTogglePause = () => (timer.isRunning ? pauseTimer() : startTimer());

  const handleFinish = () => {
    // 최소 독서 시간 전에는 종료할 수 없다 (버튼도 비활성화되어 있음)
    if (bookId === null || timer.elapsedTime < MIN_READING_SECONDS) return;
    const elapsedTime = finishReading();
    allowLeaveRef.current = true;
    // 종료 화면에서 입력을 마치기 전에 앱이 꺼져도 다시 저장할 수 있게 넘겨 둔다 (종료 화면이 이어서 갱신한다)
    if (book) {
      // 완독한 책을 다시 읽으면 새 회차라 0쪽부터 (useReadingEnd와 같은 규칙)
      const startFrom = book.status === 'COMPLETED' ? 0 : book.currentPage;
      void saveReadingDraft({
        kind: 'end', bookId, bookTitle: book.title, elapsedTime, readingTime: elapsedTime,
        startPage: startFrom, endPage: startFrom, sentence: '', savedAt: Date.now(),
      });
    }
    // 독서 종료 화면이 이 화면을 대체한다 (뒤로가기로 타이머 화면에 돌아오지 않도록).
    router.replace({ pathname: FE1_ROUTES.readingEnd, params: { bookId: String(bookId), elapsedTime: String(elapsedTime) } });
  };

  // 뒤로 갈 화면이 없으면(스택 맨 아래) 책 상세로, 책 정보도 없으면 서재로 간다
  const goBack = () => goBackOr(bookId !== null ? toBookDetail(bookId) : FE1_ROUTES.library);

  const handleLeave = () => {
    allowLeaveRef.current = true;
    setIsLeaveConfirmOpen(false);
    pauseTimer();
    // 기록하지 않고 나가기로 했으므로 보관한 시간도 지운다.
    // 지우기를 마친 뒤 이동한다. 먼저 이동하면 서재가 아직 남은 기록을 읽어 '읽던 기록이 있어요'를 띄운다.
    if (bookId !== null) void clearReadingDraft(bookId).finally(goBack);
    else goBack();
  };

  // 집중 모드: 헤더·상태바·화면 전체를 검정으로 통일하고, 시간과 버튼만 아래쪽에 둔다
  const isFocusMode = !!book && session.isFocusMode;
  const background = isFocusMode ? FOCUS_MODE_BACKGROUND : colors.background;

  const header = (
    <ScreenHeader
      title="독서 시작"
      onBack={goBack}
      tone={isFocusMode ? 'dark' : 'light'}
      right={book ? <FocusModeButton isFocusMode={session.isFocusMode} onPress={session.toggleFocusMode} /> : undefined}
    />
  );

  if (bookId === null) {
    return (
      <ScreenContainer header={header}>
        <ErrorView error={{ kind: 'client', message: '독서할 책 정보가 없어요.' }} onBack={goBack} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer header={header} backgroundColor={background} scrollable={!isFocusMode}>
      {isFocusMode ? <StatusBar style="light" /> : null}
      {session.isLoading ? <LoadingView /> : null}
      {!session.isLoading && session.error ? (
        <ErrorView error={session.error} onRetry={session.reload} onBack={goBack} />
      ) : null}
      {book && isFocusMode ? (
        <FocusModeView
          elapsedTime={timer.elapsedTime}
          isRunning={timer.isRunning}
          onTogglePause={handleTogglePause}
          onFinish={handleFinish}
        />
      ) : null}
      {book && !isFocusMode ? (
        <View style={styles.body}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${book.title} 상세 보기`}
            onPress={goBack}
            style={styles.bookCard}
          >
            <View style={styles.bookInfo}>
              <BookInfo book={book} coverWidth={80} coverHeight={104} titleSize={19} showTags={false}>
                <ReadingProgress currentPage={book.currentPage} totalPages={book.totalPages} />
              </BookInfo>
            </View>
            <Icon name="chevronRight" size={20} color={colors.secondaryText} style={styles.chevron} />
          </Pressable>

          <ReadingStage
            isRunning={timer.isRunning}
            backgroundColor={background}
            bubbleText={'좋은 책과 함께,\n오늘도 한 걸음 더!'}
          >
            {scale => (
              <>
                <ReadingTimer elapsedTime={timer.elapsedTime} isRunning={timer.isRunning} scale={scale} />
                <View style={[styles.controls, { gap: 56 * scale }]}>
                  <PauseButton isRunning={timer.isRunning} onPress={handleTogglePause} scale={scale} />
                  <FinishReadingButton elapsedTime={timer.elapsedTime} onPress={handleFinish} scale={scale} />
                </View>
              </>
            )}
          </ReadingStage>

          <ReadingTimeSummary
            today={session.readingTimeSummary?.todaySeconds}
            book={session.readingTimeSummary?.bookSeconds}
            week={session.readingTimeSummary?.weekSeconds}
          />
        </View>
      ) : null}

      <ConfirmModal
        visible={!!pendingDraft}
        title="저장하지 않은 독서 기록이 있어요"
        message={pendingDraft
          ? `『${pendingDraft.bookTitle}』 ${formatDuration(draftSeconds(pendingDraft))} 기록이 ${pendingDraft.kind === 'end' ? '저장되지 않았어요' : '남아 있어요'}. 지금 새로 읽으면 그 기록은 지워져요.`
          : ''}
        confirmLabel={pendingDraft?.kind === 'end' ? '그 기록 저장하기' : '그 기록 이어서 읽기'}
        cancelLabel="새로 읽기"
        onConfirm={resumePendingDraft}
        onCancel={discardPendingDraft}
        // 바깥을 눌러도 닫지 않는다. 둘 중 하나를 골라야 타이머를 시작할 수 있다
        onDismiss={() => undefined}
      />
      <ConfirmModal
        visible={isLeaveConfirmOpen}
        title="독서를 그만둘까요?"
        message="지금 나가면 이번 독서 시간이 기록되지 않아요. 기록하려면 '독서 종료'를 눌러주세요."
        confirmLabel="나가기"
        cancelLabel="계속 읽기"
        destructive
        onConfirm={handleLeave}
        onCancel={() => setIsLeaveConfirmOpen(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { flexGrow: 1, gap: spacing.sm },
  bookCard: { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.md, zIndex: 1, ...softShadow },
  bookInfo: { flex: 1, paddingRight: spacing.md },
  chevron: { position: 'absolute', top: spacing.md + 6, right: spacing.md },
  controls: { flexDirection: 'row', justifyContent: 'center' },
});
