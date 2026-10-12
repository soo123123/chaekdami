import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ManualBookInput } from '../components/book/ManualBookInput';
import { AppButton } from '../components/common/AppButton';
import { Card } from '../components/common/Card';
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
import { digitsOnly, isValidIsbn, todayIso } from '../utils/format';

/**
 * 표지 이미지 선택은 expo-image-picker 설치와 업로드 계약 확정 후 연결한다.
 * (현재 저장소에는 해당 의존성이 없고, 업로드 방식도 미확정)
 */
const COVER_PICKER_NOTICE = '표지 이미지 등록은 업로드 방식이 확정되면 지원할 예정이에요.';

export function ManualRegisterScreen() {
  const form = useBookRegistration({ kind: 'manual' });
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isIsbnOpen, setIsIsbnOpen] = useState(false);
  const [coverNotice, setCoverNotice] = useState<string | null>(null);

  const handleRegister = async () => {
    const registered = await form.registerBook();
    if (registered) router.dismissTo(FE1_ROUTES.library);
  };

  return (
    <ScreenContainer
      header={<ScreenHeader title="수동 등록" onBack={() => router.back()} />}
      footer={<AppButton onPress={handleRegister} isLoading={form.isLoading}>책 등록하기</AppButton>}
    >
      <View style={styles.intro}>
        <Text style={styles.introTitle}>책 정보를 직접 입력해요</Text>
        <Text style={styles.introDesc}>검색되지 않는 책도 등록할 수 있어요.</Text>
      </View>

      <Card title="책 기본 정보">
        <ManualBookInput
          book={form.book}
          onChange={form.setBook}
          onPressCover={() => setCoverNotice(COVER_PICKER_NOTICE)}
          onPressPublishedDate={() => setIsDateOpen(true)}
          onPressIsbn={() => setIsIsbnOpen(true)}
          errors={form.fieldErrors}
        />
        {coverNotice ? <Text style={styles.notice}>{coverNotice}</Text> : null}
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

const styles = StyleSheet.create({
  intro: { gap: spacing.xs, paddingVertical: spacing.xs },
  introTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  introDesc: { fontSize: 15, color: colors.secondaryText },
  notice: { fontSize: 12, color: colors.secondaryText },
});
