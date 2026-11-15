import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ManualBookInput } from '../components/book/ManualBookInput';
import { RegisterButton } from '../components/book/RegisterButton';
import { BottomSheetModal } from '../components/common/BottomSheetModal';
import { Card } from '../components/common/Card';
import { CatBooksDecor } from '../components/common/Decor';
import { Icon, type IconName } from '../components/common/Icon';
import { DatePickerModal } from '../components/common/DatePickerModal';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { InlineError } from '../components/common/StateView';
import { TextInputModal } from '../components/common/TextInputModal';
import { PublicSetting } from '../components/reading/PublicSetting';
import { ReadingGoalSetting } from '../components/reading/ReadingGoalSetting';
import { ReadingStatusInput } from '../components/reading/ReadingStatusInput';
import { FE1_ROUTES } from '../constants/routes';
import { colors, spacing } from '../constants/theme';
import { useBookRegistration } from '../hooks/book/useBookRegistration';
import { useImagePicker } from '../hooks/common/useImagePicker';
import { digitsOnly, isValidIsbn, todayIso } from '../utils/format';

/** 표지 자르기 비율 (가로:세로) */
const COVER_ASPECT: [number, number] = [2, 3];

export function ManualRegisterScreen() {
  const form = useBookRegistration({ kind: 'manual' });
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isIsbnOpen, setIsIsbnOpen] = useState(false);
  const [isCoverSheetOpen, setIsCoverSheetOpen] = useState(false);
  const picker = useImagePicker();

  /** 표지는 기기의 로컬 URI로 보관한다. 업로드 방식은 백엔드 계약 확정 후 API 계층에서 처리한다. */
  const pickCover = (source: 'camera' | 'library') => async () => {
    setIsCoverSheetOpen(false);
    const [uri] = source === 'camera'
      ? await picker.takePhoto({ aspect: COVER_ASPECT })
      : await picker.pickFromLibrary({ aspect: COVER_ASPECT });
    if (uri) form.setBook({ coverImageUri: uri });
  };

  const handleRegister = async () => {
    const registered = await form.registerBook();
    if (registered) router.dismissTo(FE1_ROUTES.library);
  };

  return (
    <ScreenContainer
      header={<ScreenHeader title="수동 등록" onBack={() => router.back()} />}
      footer={<RegisterButton onPress={handleRegister} isLoading={form.isLoading} />}
    >
      <View style={styles.intro}>
        <CatBooksDecor width={150} style={styles.decor} />
        <Text style={styles.introTitle}>책 정보를 직접 입력해요</Text>
        <Text style={styles.introDesc}>검색되지 않는 책도 등록할 수 있어요.</Text>
      </View>

      <Card title="책 기본 정보">
        <ManualBookInput
          book={form.book}
          onChange={form.setBook}
          onPressCover={() => setIsCoverSheetOpen(true)}
          onPressPublishedDate={() => setIsDateOpen(true)}
          onPressIsbn={() => setIsIsbnOpen(true)}
          errors={form.fieldErrors}
        />
        {picker.error ? <Text style={styles.notice} accessibilityRole="alert">{picker.error}</Text> : null}
      </Card>

      <Card title="읽기 현황 설정">
        <ReadingStatusInput
          currentPage={form.currentPage}
          totalPages={form.totalPages}
          onChange={form.setCurrentPage}
          isTotalEditable
          onTotalChange={form.setTotalPages}
          error={form.pageError}
        />
      </Card>

      <Card>
        <ReadingGoalSetting
          goalDate={form.goalDate}
          goalPage={form.goalPage}
          currentPage={form.currentPage}
          totalPages={form.totalPages}
          onDateChange={form.setGoalDate}
          onPageChange={form.setGoalPage}
        />
      </Card>

      <PublicSetting isPublic={form.isPublic} onChange={form.setIsPublic} />
      <InlineError message={form.submitError} />

      <BottomSheetModal visible={isCoverSheetOpen} title="표지 추가" onClose={() => setIsCoverSheetOpen(false)}>
        <View>
          <SheetItem icon="camera" label="사진 촬영하기" onPress={pickCover('camera')} />
          <SheetItem icon="gallery" label="갤러리에서 선택하기" onPress={pickCover('library')} />
          {form.book.coverImageUri ? (
            <SheetItem
              icon="trash"
              label="표지 삭제"
              danger
              onPress={() => { setIsCoverSheetOpen(false); form.setBook({ coverImageUri: undefined }); }}
            />
          ) : null}
        </View>
      </BottomSheetModal>

      <DatePickerModal
        visible={isDateOpen}
        title="출판일 (선택)"
        value={form.book.publishedDate}
        maxDate={todayIso()}
        onConfirm={publishedDate => form.setBook({ publishedDate })}
        onClear={form.book.publishedDate ? () => form.setBook({ publishedDate: undefined }) : undefined}
        onClose={() => setIsDateOpen(false)}
      />
      <TextInputModal
        visible={isIsbnOpen}
        title="ISBN (선택)"
        description="10자리 또는 13자리 숫자를 입력해주세요."
        initialValue={form.book.isbn ?? ''}
        placeholder="9791162540640"
        keyboardType="number-pad"
        maxLength={17}
        validate={value => (isValidIsbn(value) ? null : 'ISBN은 10자리 또는 13자리 숫자여야 해요.')}
        onConfirm={value => form.setBook({ isbn: digitsOnly(value) })}
        onClear={form.book.isbn ? () => form.setBook({ isbn: undefined }) : undefined}
        onClose={() => setIsIsbnOpen(false)}
      />
    </ScreenContainer>
  );
}

function SheetItem({ icon, label, danger, onPress }: { icon: IconName; label: string; danger?: boolean; onPress: () => void }) {
  const tint = danger ? colors.danger : colors.text;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.sheetItem}>
      <Icon name={icon} size={22} color={tint} />
      <Text style={[styles.sheetLabel, { color: tint }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  intro: { gap: spacing.xs, paddingTop: spacing.lg, paddingBottom: spacing.xl + 4, zIndex: 1 },
  decor: { right: -spacing.sm, bottom: -10 },
  introTitle: { fontSize: 23, fontWeight: '800', color: colors.text, letterSpacing: -0.4 },
  introDesc: { fontSize: 16, color: colors.secondaryText },
  notice: { fontSize: 13, color: colors.danger },
  sheetItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4, minHeight: 54, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  sheetLabel: { fontSize: 16, fontWeight: '600' },
});
