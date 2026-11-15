import { router, useNavigation } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
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
import { toBookDetail } from '@/constants/routes';
import { FE1_ROUTES } from '../constants/routes';
import { colors, radius, softShadow, spacing } from '../constants/theme';
import { useBookIdParam } from '../hooks/common/useRouteParams';
import { useReadingSession } from '../hooks/reading/useReadingSession';
import { useReadingTimer } from '../hooks/reading/useReadingTimer';
import { goBackOr } from '../utils/navigation';

export function ReadingStartScreen() {
  const bookId = useBookIdParam();
  const session = useReadingSession(bookId);
  const timer = useReadingTimer();
  const navigation = useNavigation();
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);
  const allowLeaveRef = useRef(false);
  const { book } = session;
  const { startTimer, pauseTimer, finishReading } = timer;

  // 책 정보 조회 성공 시 독서(타이머)를 시작한다.
  const hasStartedRef = useRef(false);
  useEffect(() => {
    if (book && !hasStartedRef.current) {
      hasStartedRef.current = true;
      startTimer();
    }
  }, [book, startTimer]);

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

  const handleTogglePause = () => (timer.isRunning ? pauseTimer() : startTimer());

  const handleFinish = () => {
    // 최소 독서 시간 전에는 종료할 수 없다 (버튼도 비활성화되어 있음)
    if (bookId === null || timer.elapsedTime < MIN_READING_SECONDS) return;
    const elapsedTime = finishReading();
    allowLeaveRef.current = true;
    // 독서 종료 화면이 이 화면을 대체한다 (뒤로가기로 타이머 화면에 돌아오지 않도록).
    router.replace({ pathname: FE1_ROUTES.readingEnd, params: { bookId: String(bookId), elapsedTime: String(elapsedTime) } });
  };

  // 뒤로 갈 화면이 없으면(스택 맨 아래) 책 상세로, 책 정보도 없으면 서재로 간다
  const goBack = () => goBackOr(bookId !== null ? toBookDetail(bookId) : FE1_ROUTES.library);

  const handleLeave = () => {
    allowLeaveRef.current = true;
    setIsLeaveConfirmOpen(false);
    pauseTimer();
    goBack();
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
