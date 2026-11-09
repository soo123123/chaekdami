import { colors } from '../../constants/theme';
import { AppButton } from '../common/AppButton';
import { Icon } from '../common/Icon';

type RegisterBookButtonProps = {
  onPress: () => void;
  /** 이미 내 서재에 있는 책이면 비활성화하고 안내 문구를 보여준다 */
  registered?: boolean;
};

/** 책 정보 화면 → 선택한 책의 등록 화면으로 이동 */
export function RegisterBookButton({ onPress, registered = false }: RegisterBookButtonProps) {
  return (
    <AppButton
      onPress={onPress}
      disabled={registered}
      icon={<Icon name="bookOpen" size={26} color={colors.onPrimary} />}
    >
      {registered ? '이미 서재에 있는 책이에요' : '이 책을 등록하기'}
    </AppButton>
  );
}
