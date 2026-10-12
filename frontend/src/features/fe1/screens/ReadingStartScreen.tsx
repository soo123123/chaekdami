import { router, useNavigation } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BookCover } from '../components/common/BookCover';
import { ConfirmModal } from '../components/common/BottomSheetModal';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { ErrorView, LoadingView } from '../components/common/StateView';
import { ReadingProgress } from '../components/reading/ReadingProgress';
import { ReadingTimeSummary } from '../components/reading/ReadingTimeSummary';
import { FinishReadingButton, FocusModeButton, PauseButton, ReadingTimer } from '../components/reading/TimerControls';
import { FE1_ROUTES } from '../constants/routes';
import { colors, radius, spacing } from '../constants/theme';
import { useBookIdParam } from '../hooks/common/useRouteParams';
import { useReadingSession } from '../hooks/reading/useReadingSession';
import { useReadingTimer } from '../hooks/reading/useReadingTimer';

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
    if (bookId === null) return;
    const elapsedTime = finishReading();
    allowLeaveRef.current = true;
    // 독서 종료 화면이 이 화면을 대체한다 (뒤로가기로 타이머 화면에 돌아오지 않도록).
    router.replace({ pathname: FE1_ROUTES.readingEnd, params: { bookId: String(bookId), elapsedTime: String(elapsedTime) } });
  };

  const handleLeave = () => {
    allowLeaveRef.current = true;
    setIsLeaveConfirmOpen(false);
    pauseTimer();
    router.back();
  };

  const header = (
    <ScreenHeader
      title="독서 시작"
      onBack={() => router.back()}
      right={book ? <FocusModeButton isFocusMode={session.isFocusMode} onPress={session.toggleFocusMode} /> : undefined}
    />
  );

  if (bookId === null) {
    return (
      <ScreenContainer header={header}>
        <ErrorView error={{ kind: 'client', message: '독서할 책 정보가 없어요.' }} onBack={() => router.back()} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer header={header} backgroundColor={session.isFocusMode ? '#F1E6D6' : colors.background}>
      {session.isLoading ? <LoadingView /> : null}
      {!session.isLoading && session.error ? (
        <ErrorView error={session.error} onRetry={session.reload} onBack={() => router.back()} />
      ) : null}
      {book ? (
        <View style={styles.body}>
          {!session.isFocusMode ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${book.title} 상세 보기`}
              onPress={() => router.back()}
              style={styles.bookCard}
            >
              <BookCover uri={book.coverImageUrl} title={book.title} width={70} />
              <View style={styles.bookInfo}>
                <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
                <Text style={styles.bookAuthor} numberOfLines={1}>{book.author}</Text>
                <ReadingProgress currentPage={book.currentPage} totalPages={book.totalPages} />
              </View>
            </Pressable>
          ) : null}

          <View style={[styles.stage, session.isFocusMode && styles.stageFocus]}>
            <View style={styles.bubble}>
              <Text style={styles.bubbleText}>
                {session.isFocusMode ? '집중 모드예요.\n책에만 몰입해볼까요?' : '좋은 책과 함께,\n오늘도 한 걸음 더!'}
              </Text>
            </View>
            <ReadingTimer elapsedTime={timer.elapsedTime} isRunning={timer.isRunning} />
            <View style={styles.controls}>
              <PauseButton isRunning={timer.isRunning} onPress={handleTogglePause} />
              <FinishReadingButton onPress={handleFinish} />
            </View>
          </View>

          {!session.isFocusMode ? <ReadingTimeSummary summary={session.readingTimeSummary} /> : null}
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
  body: { flexGrow: 1, gap: spacing.lg },
  bookCard: { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  bookInfo: { flex: 1, gap: spacing.xs },
  bookTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  bookAuthor: { fontSize: 14, color: colors.secondaryText },
  stage: { alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.md },
  stageFocus: { flexGrow: 1, justifyContent: 'center' },
  bubble: { backgroundColor: colors.surface, borderRadius: radius.card, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 4, borderWidth: 1, borderColor: colors.border },
  bubbleText: { fontSize: 15, lineHeight: 22, color: colors.text, textAlign: 'center' },
  controls: { flexDirection: 'row', gap: spacing.xl + 8, justifyContent: 'center' },
});
