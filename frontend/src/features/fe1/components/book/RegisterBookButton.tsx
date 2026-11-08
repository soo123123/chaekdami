import { colors } from '../../constants/theme';
import { AppButton } from '../common/AppButton';
import { Icon } from '../common/Icon';

/** 책 정보 화면 → 선택한 책의 등록 화면으로 이동 */
export function RegisterBookButton({ onPress }: { onPress: () => void }) {
  return (
    <AppButton onPress={onPress} icon={<Icon name="bookOpen" size={26} color={colors.onPrimary} />}>
      이 책을 등록하기
    </AppButton>
  );
}
