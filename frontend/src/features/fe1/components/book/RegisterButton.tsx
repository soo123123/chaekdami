import { AppButton } from '../common/AppButton';

/** 책 등록 실행 (검색 도서 등록 / 수동 등록 공용) */
export function RegisterButton({ onPress, isLoading = false }: { onPress: () => void; isLoading?: boolean }) {
  return (
    <AppButton onPress={onPress} isLoading={isLoading}>
      책 등록하기
    </AppButton>
  );
}
