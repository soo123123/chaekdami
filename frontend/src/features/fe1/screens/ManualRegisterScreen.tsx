import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ManualBookInput } from '../components/book/ManualBookInput';
import { RegisterButton } from '../components/book/RegisterButton';
import { Card } from '../components/common/Card';
import { CatBooksDecor } from '../components/common/Decor';
import { DatePickerModal } from '../components/common/DatePickerModal';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { InlineError } from '../components/common/StateView';
import { TextInputModal } from '../components/common/TextInputModal';
import { PublicSetting } from '../components/reading/PublicSetting';
import { ReadingGoalSetting } from '../components/reading/ReadingGoalSetting';
import { ReadingStatusInput } from '../components/reading/ReadingStatusInput';
import { AppButton } from '../components/common/AppButton';
import { FE1_ROUTES } from '../constants/routes';
import { colors, spacing } from '../constants/theme';
import { useBookRegistration } from '../hooks/book/useBookRegistration';
import { digitsOnly, isValidIsbn, todayIso } from '../utils/format';

export function ManualRegisterScreen() {
  const form = useBookRegistration({ kind: 'manual' });
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isIsbnOpen, setIsIsbnOpen] = useState(false);
  // 표지 사진은 고를 수 없게 막아 둔다. 서버에 이미지 업로드 API가 없어 골라도 저장되지 않는다 (ISSUE-BUG-21)

  const handleRegister = async () => {
    const registered = await form.registerBook();
    if (!registered) return;
    router.dismissTo(FE1_ROUTES.library);
    // 설정 저장만 실패했으면 책 상세에서 다시 저장하도록 바로 연다 (ISSUE-BUG-20)
    if (registered.settingsSaveFailed) router.push({ pathname: FE1_ROUTES.detail, params: { bookId: String(registered.bookId) } });
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
          onPressPublishedDate={() => setIsDateOpen(true)}
          onPressIsbn={() => setIsIsbnOpen(true)}
          errors={form.fieldErrors}
        />
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
      {form.existingBookId !== null ? (
        <AppButton variant="secondary" size="md" onPress={() => router.replace({ pathname: FE1_ROUTES.detail, params: { bookId: String(form.existingBookId) } })}>
          서재에 있는 책 보기
        </AppButton>
      ) : null}


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
  intro: { gap: spacing.xs, paddingTop: spacing.lg, paddingBottom: spacing.xl + 4, zIndex: 1 },
  decor: { right: -spacing.sm, bottom: -10 },
  introTitle: { fontSize: 23, fontWeight: '800', color: colors.text, letterSpacing: -0.4 },
  introDesc: { fontSize: 16, color: colors.secondaryText },
});
