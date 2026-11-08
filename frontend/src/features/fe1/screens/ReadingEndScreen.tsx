import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { AppButton } from '../components/common/AppButton';
import { Card } from '../components/common/Card';
import { ReadingEndSceneDecor } from '../components/common/Decor';
import { Icon } from '../components/common/Icon';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { ErrorView, InlineError, LoadingView } from '../components/common/StateView';
import { BookPhotoUploader } from '../components/reading/BookPhotoUploader';
import { ReadingPageRange, ReadingTime } from '../components/reading/ReadingRecordFields';
import { ReadingResult } from '../components/reading/ReadingResult';
import { SaveReadingRecordButton } from '../components/reading/SaveReadingRecordButton';
import { SentenceInput } from '../components/reading/SentenceInput';
import { FE1_ROUTES, READING_COMPLETE_ROUTE } from '../constants/routes';
import { colors, HIT_SLOP, keepAllWords, radius, softShadow, spacing } from '../constants/theme';
import { useImagePicker } from '../hooks/common/useImagePicker';
import { useReadingEndParams } from '../hooks/common/useRouteParams';
import { useReadingEnd } from '../hooks/reading/useReadingEnd';
import { formatDuration, todayIso } from '../utils/format';

export function ReadingEndScreen() {
  const { bookId, elapsedTime } = useReadingEndParams();
  const record = useReadingEnd(bookId, elapsedTime);
  const { book } = record;
  const [today] = useState(todayIso);
  const picker = useImagePicker();
  const { width: windowWidth } = useWindowDimensions();
  const sceneWidth = Math.min(windowWidth, 560) * 0.66;

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

  /** 선택한 사진을 기존 목록 뒤에 붙인다 (같은 사진은 한 번만) */
  const addPhotos = (uris: string[]) => {
    if (uris.length === 0) return;
    record.setPhotos(prev => {
      const known = new Set(prev.map(photo => photo.uri));
      return [...prev, ...uris.filter(uri => !known.has(uri)).map(uri => ({ uri }))];
    });
  };

  // 이번 기록 입력 내용은 유지한 채 책 상세(지난 기록·문장)를 연다.
  const openRecords = () => {
    if (bookId !== null) router.push({ pathname: FE1_ROUTES.detail, params: { bookId: String(bookId) } });
  };

  const header = (
    <ScreenHeader
      title="독서 종료하기"
      onBack={() => router.back()}
      right={bookId !== null ? (
        <Pressable accessibilityRole="button" hitSlop={HIT_SLOP} onPress={openRecords} style={styles.recordsButton}>
          <Icon name="record" size={18} color={colors.text} />
          <Text style={styles.recordsLabel}>독서 기록 보기</Text>
        </Pressable>
      ) : undefined}
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
          <Icon name="check" size={56} color={colors.primary} />
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
        <SaveReadingRecordButton onPress={handleSave} isLoading={record.isLoading} />
      ) : undefined}
    >
      {record.isBookLoading ? <LoadingView /> : null}
      {!record.isBookLoading && record.loadError ? (
        <ErrorView error={record.loadError} onRetry={record.reload} onBack={() => router.back()} />
      ) : null}
      {book ? (
        <>
          <View style={styles.intro}>
            <ReadingEndSceneDecor width={sceneWidth} style={styles.scene} />
            <Text style={styles.introTitle}>{'오늘도\n좋은 책과 함께했어요!'}</Text>
            <Text style={styles.introDesc}>{'지금의 이 순간이, 더 나은 내일을\n만들어 줄 거예요.'}</Text>
          </View>

          <ReadingResult
            result={{
              title: book.title,
              author: book.author,
              coverImageUrl: book.coverImageUrl,
              date: today,
              readingTime: record.readingTime,
              isFinished: !!book.totalPages && record.endPage >= book.totalPages,
            }}
          />

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

          <Card title="책 사진 첨부하기" subtitle="책 표지나 인상 깊었던 페이지를 사진으로 남겨보세요.">
            <BookPhotoUploader
              photos={record.photos}
              onChange={record.setPhotos}
              onTakePhoto={async () => addPhotos(await picker.takePhoto())}
              onPickFromGallery={async () => addPhotos(await picker.pickFromLibrary({ multiple: true }))}
              errorMessage={picker.error}
            />
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
  recordsButton: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, paddingHorizontal: spacing.md - 2, borderRadius: radius.pill, backgroundColor: colors.surface, ...softShadow },
  recordsLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  intro: { gap: spacing.sm, paddingTop: spacing.sm, paddingBottom: spacing.md, minHeight: 128 },
  scene: { right: -spacing.md, top: -spacing.sm },
  introTitle: { fontSize: 23, lineHeight: 32, fontWeight: '800', color: colors.text, letterSpacing: -0.4, ...keepAllWords },
  introDesc: { fontSize: 14, lineHeight: 20, color: colors.secondaryText },
  fields: { flexDirection: 'row', borderWidth: 1, borderColor: colors.border, borderRadius: radius.input + 2, backgroundColor: '#FBF7F1' },
  fieldDivider: { width: 1, backgroundColor: colors.border },
  hint: { fontSize: 13, color: colors.secondaryText },
  retry: { fontSize: 14, color: colors.primary, fontWeight: '700', textAlign: 'center' },
  done: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.md },
  doneTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  doneDesc: { fontSize: 15, color: colors.secondaryText, textAlign: 'center', lineHeight: 22 },
});
