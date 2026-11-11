import { router, useNavigation } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { AppButton } from '../components/common/AppButton';
import { ConfirmModal } from '../components/common/BottomSheetModal';
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
import { showToast } from '@/components/Toast';
import { ROUTES, toBookDetail, toReadingComplete } from '@/constants/routes';
import { FE1_ROUTES } from '../constants/routes';
import { colors, HIT_SLOP, keepAllWords, radius, softShadow, spacing } from '../constants/theme';
import { useImagePicker } from '../hooks/common/useImagePicker';
import { useReadingEndParams } from '../hooks/common/useRouteParams';
import { useReadingEnd } from '../hooks/reading/useReadingEnd';
import { formatDuration, todayIso } from '../utils/format';
import { goBackOr } from '../utils/navigation';

export function ReadingEndScreen() {
  const { bookId, elapsedTime } = useReadingEndParams();
  const record = useReadingEnd(bookId, elapsedTime);
  const { book } = record;
  const [today] = useState(todayIso);
  const picker = useImagePicker();
  const { width: windowWidth } = useWindowDimensions();
  const sceneWidth = Math.min(windowWidth, 560) * 0.66;
  const navigation = useNavigation();
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);
  const allowLeaveRef = useRef(false);

  // 저장하지 않고 화면을 벗어나려 하면 확인한다 (헤더 < 버튼, 뒤로가기 제스처/하드웨어 버튼 포함).
  // 책 정보를 불러오지 못한 경우(기록할 내용이 없음)와 저장을 마친 뒤에는 묻지 않는다.
  // '독서 기록 보기'는 이 화면 위에 새 화면을 여는 것이라 이 화면이 사라지지 않으므로 해당되지 않는다.
  const shouldConfirmLeave = !!book && record.status !== 'success';
  useEffect(() => {
    return navigation.addListener('beforeRemove', event => {
      if (allowLeaveRef.current || !shouldConfirmLeave) return;
      event.preventDefault();
      setIsLeaveConfirmOpen(true);
    });
  }, [navigation, shouldConfirmLeave]);

  // 뒤로 갈 화면이 없으면(딥링크로 바로 연 경우) 책 상세로, 책 정보도 없으면 서재로 간다
  const goBack = () => goBackOr(bookId !== null ? toBookDetail(bookId) : FE1_ROUTES.library);

  const handleLeave = () => {
    allowLeaveRef.current = true;
    setIsLeaveConfirmOpen(false);
    goBack();
  };

  const handleSave = async () => {
    const saved = await record.saveReadingRecord();
    if (!saved.ok) {
      // 저장 버튼은 화면 아래에 있어 본문 오류 문구가 안 보일 수 있으므로 상단에도 띄운다.
      showToast(saved.message, 'error');
      return;
    }
    showToast('저장이 완료되었습니다.');
    allowLeaveRef.current = true; // 저장을 마쳤으므로 이후 화면 이동은 확인 없이 진행한다
    // 저장 성공 응답 확인 후에만 FE2 독서 완료 화면으로 이동한다.
    // replace: 완료 화면에서 뒤로 가도 이미 저장한 독서 종료 화면으로 돌아오지 않게 한다.
    if (bookId === null) return; // 위에서 책 정보가 없으면 저장되지 않으므로 실제로는 오지 않는다
    router.replace(toReadingComplete({
      readingRecordId: saved.readingRecordId,
      bookId,
      durationMinutes: Math.round(record.readingTime / 60),
      pagesRead: Math.max(record.endPage - record.startPage, 0),
      round: saved.round,
      isCompleted: saved.isCompleted,
      remainingPages: book?.totalPages ? Math.max(book.totalPages - record.endPage, 0) : undefined,
    }));
  };

  const goHome = () => router.dismissTo(ROUTES.home);

  /** 선택한 사진을 기존 목록 뒤에 붙인다 (같은 사진은 한 번만) */
  const addPhotos = (uris: string[]) => {
    if (uris.length === 0) return;
    record.setPhotos(prev => {
      const known = new Set(prev.map(photo => photo.uri));
      return [...prev, ...uris.filter(uri => !known.has(uri)).map(uri => ({ uri }))];
    });
  };

  // 이번 기록 입력 내용은 유지한 채 책 상세(지난 기록·문장)를 조회 전용으로 연다.
  const openRecords = () => {
    if (bookId !== null) router.push({ pathname: FE1_ROUTES.detail, params: { bookId: String(bookId), mode: 'records' } });
  };

  const header = (
    <ScreenHeader
      title="독서 종료하기"
      // 헤더 < 버튼은 이벤트에 기대지 않고 바로 확인 창을 띄운다 (제스처·하드웨어 뒤로가기는 beforeRemove에서 처리)
      onBack={() => (shouldConfirmLeave ? setIsLeaveConfirmOpen(true) : goBack())}
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
        <ErrorView error={{ kind: 'client', message: '기록할 책 정보가 없어요.' }} onBack={goBack} />
      </ScreenContainer>
    );
  }

  // 저장 완료 상태: 완료 화면으로 넘어가는 동안 잠깐 보이는 화면 (이동이 실패해도 홈으로 갈 수 있게 버튼을 둔다)
  if (record.status === 'success') {
    return (
      <ScreenContainer header={<ScreenHeader title="독서 종료하기" />} footer={<AppButton onPress={goHome}>홈으로 돌아가기</AppButton>}>
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
        <ErrorView error={record.loadError} onRetry={record.reload} onBack={goBack} />
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
              <ReadingTime duration={record.readingTime} maxDuration={elapsedTime} onChange={record.setReadingTime} />
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

          <Card title="책 사진 첨부하기" subtitle="책 표지나 인상 깊었던 페이지를 사진으로 남겨보세요." right={<RequiredMark />}>
            <BookPhotoUploader
              photos={record.photos}
              onChange={record.setPhotos}
              onTakePhoto={async () => addPhotos(await picker.takePhoto())}
              onPickFromGallery={async () => addPhotos(await picker.pickFromLibrary({ multiple: true }))}
              errorMessage={picker.error}
            />
          </Card>

          <Card title="인상 깊었던 문장" subtitle="가장 기억에 남는 문장을 적어보세요." right={<RequiredMark />}>
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

      <ConfirmModal
        visible={isLeaveConfirmOpen}
        title="기록하지 않고 나갈까요?"
        message="지금 나가면 이번 독서 시간과 입력한 내용이 저장되지 않아요. 기록하려면 '기록 저장하기'를 눌러주세요."
        confirmLabel="나가기"
        cancelLabel="계속 기록하기"
        destructive
        onConfirm={handleLeave}
        onCancel={() => setIsLeaveConfirmOpen(false)}
      />
    </ScreenContainer>
  );
}

/** 필수 입력 항목 표시 */
function RequiredMark() {
  return <Text style={styles.required}>필수</Text>;
}

const styles = StyleSheet.create({
  required: { fontSize: 13, fontWeight: '700', color: colors.danger },
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
