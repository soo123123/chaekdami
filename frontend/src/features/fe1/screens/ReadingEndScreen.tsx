import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/common/AppButton';
import { BookCover } from '../components/common/BookCover';
import { Card } from '../components/common/Card';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { ErrorView, InlineError, LoadingView } from '../components/common/StateView';
import { BookPhotoUploader } from '../components/reading/BookPhotoUploader';
import { ReadingPageRange, ReadingTime } from '../components/reading/ReadingRecordFields';
import { SentenceInput } from '../components/reading/SentenceInput';
import { FE1_ROUTES, READING_COMPLETE_ROUTE } from '../constants/routes';
import { colors, radius, spacing } from '../constants/theme';
import { useReadingEndParams } from '../hooks/common/useRouteParams';
import { useReadingEnd } from '../hooks/reading/useReadingEnd';
import { formatDateWithWeekday, formatDuration, todayIso } from '../utils/format';

/** 사진 첨부는 expo-image-picker 설치 및 업로드 계약 확정 후 연결한다. */
const PHOTO_UNAVAILABLE = '사진 첨부는 업로드 방식이 확정되면 사용할 수 있어요. (선택 항목)';

export function ReadingEndScreen() {
  const { bookId, elapsedTime } = useReadingEndParams();
  const record = useReadingEnd(bookId, elapsedTime);
  const { book } = record;
  const [today] = useState(todayIso);

  // 독서 시작 화면은 이 화면으로 대체되었으므로 이전 화면이 책 상세다 (포커스 시 재조회).
  const goToBookDetail = () => {
    if (router.canGoBack()) return router.back();
    if (bookId !== null) router.replace({ pathname: FE1_ROUTES.detail, params: { bookId: String(bookId) } });
  };

  const handleSave = async () => {
    const saved = await record.saveReadingRecord();
    if (!saved) return;
    // 저장 성공 응답 확인 후에만 다음 화면으로 이동한다.
    // FE2 ReadingCompleteScreen 경로가 합의되면 READING_COMPLETE_ROUTE로 이동한다.
    if (READING_COMPLETE_ROUTE) {
      router.replace(READING_COMPLETE_ROUTE as never);
    }
  };

  const header = (
    <ScreenHeader
      title="독서 종료하기"
      onBack={() => router.back()}
    />
  );

  if (bookId === null) {
    return (
      <ScreenContainer header={header}>
        <ErrorView error={{ kind: 'client', message: '기록할 책 정보가 없어요.' }} onBack={() => router.back()} />
      </ScreenContainer>
    );
  }

  // FE2 완료 화면이 연결되기 전까지 표시하는 저장 완료 상태
  if (record.status === 'success' && !READING_COMPLETE_ROUTE) {
    return (
      <ScreenContainer header={<ScreenHeader title="독서 종료하기" />} footer={<AppButton onPress={goToBookDetail}>책 상세로 돌아가기</AppButton>}>
        <View style={styles.done}>
          <Text style={styles.doneEmoji}>🎉</Text>
          <Text style={styles.doneTitle}>독서 기록을 저장했어요!</Text>
          <Text style={styles.doneDesc}>
            {`${formatDuration(record.readingTime)} 동안 ${record.startPage}쪽부터 ${record.endPage}쪽까지 읽었어요.`}
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      header={header}
      footer={book ? (
        <AppButton onPress={handleSave} isLoading={record.isLoading} icon={<Text style={styles.saveIcon}>💾</Text>}>
          기록 저장하기
        </AppButton>
      ) : undefined}
    >
      {record.isBookLoading ? <LoadingView /> : null}
      {!record.isBookLoading && record.loadError ? (
        <ErrorView error={record.loadError} onRetry={record.reload} onBack={() => router.back()} />
      ) : null}
      {book ? (
        <>
          <View style={styles.intro}>
            <Text style={styles.introTitle}>{'오늘도\n좋은 책과 함께했어요!'}</Text>
            <Text style={styles.introDesc}>지금의 이 순간이, 더 나은 내일을 만들어 줄 거예요.</Text>
          </View>

          {/* ReadingResult */}
          <Card>
            <View style={styles.result}>
              <BookCover uri={book.coverImageUrl} title={book.title} width={78} />
              <View style={styles.resultInfo}>
                <View style={styles.resultTitleRow}>
                  <Text style={styles.resultTitle} numberOfLines={2}>{book.title}</Text>
                  {book.totalPages && record.endPage >= book.totalPages ? (
                    <View style={styles.badge}><Text style={styles.badgeLabel}>독서 완료</Text></View>
                  ) : null}
                </View>
                <Text style={styles.resultAuthor} numberOfLines={1}>{book.author}</Text>
                <Text style={styles.resultMeta}>{`📅  ${formatDateWithWeekday(today)}`}</Text>
                <Text style={styles.resultMeta}>{`🕒  독서 시간 ${formatDuration(record.readingTime)}`}</Text>
              </View>
            </View>
          </Card>

          <Card title="독서 정보 기록" subtitle="오늘의 독서 기록을 남겨보세요.">
            <View style={styles.fields}>
              <ReadingTime duration={record.readingTime} onChange={record.setReadingTime} />
              <View style={styles.fieldDivider} />
              <ReadingPageRange
                startPage={record.startPage}
                endPage={record.endPage}
                totalPages={book.totalPages}
                onChange={record.setPageRange}
              />
            </View>
            {elapsedTime === 0 ? (
              <Text style={styles.hint}>측정된 독서 시간이 없어요. ‘수정’을 눌러 독서 시간을 입력해주세요.</Text>
            ) : null}
          </Card>

          <Card title="책 사진 첨부하기" subtitle="책 표지나 인상 깊었던 페이지를 남겨보세요.">
            <BookPhotoUploader photos={record.photos} onChange={record.setPhotos} unavailableMessage={PHOTO_UNAVAILABLE} />
          </Card>

          <Card title="인상 깊었던 문장" subtitle="가장 기억에 남는 문장을 적어보세요.">
            <SentenceInput value={record.sentence} onChange={record.setSentence} />
          </Card>

          <InlineError message={record.saveError} />
          {record.status === 'error' ? (
            <Pressable accessibilityRole="button" onPress={handleSave}>
              <Text style={styles.retry}>다시 시도하기</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  saveIcon: { fontSize: 18 },
  intro: { gap: spacing.sm, paddingVertical: spacing.xs },
  introTitle: { fontSize: 24, lineHeight: 32, fontWeight: '800', color: colors.text },
  introDesc: { fontSize: 14, color: colors.secondaryText },
  result: { flexDirection: 'row', gap: spacing.md },
  resultInfo: { flex: 1, gap: spacing.xs },
  resultTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  resultTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.text },
  resultAuthor: { fontSize: 14, color: colors.secondaryText },
  resultMeta: { fontSize: 14, color: colors.secondaryText },
  badge: { backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: spacing.sm + 2, paddingVertical: 4 },
  badgeLabel: { fontSize: 12, color: colors.primary, fontWeight: '700' },
  fields: { flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1, borderColor: colors.border, borderRadius: radius.input, backgroundColor: colors.background },
  fieldDivider: { width: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  hint: { fontSize: 13, color: colors.secondaryText },
  retry: { fontSize: 14, color: colors.primary, fontWeight: '700', textAlign: 'center' },
  done: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.md },
  doneEmoji: { fontSize: 56 },
  doneTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  doneDesc: { fontSize: 15, color: colors.secondaryText, textAlign: 'center', lineHeight: 22 },
});
