import { colors } from '../../constants/theme';
import { AppButton } from '../common/AppButton';
import { Icon } from '../common/Icon';

/** 독서 기록 저장. 저장 중에는 비활성화된다. */
export function SaveReadingRecordButton({ onPress, isLoading }: { onPress: () => void; isLoading: boolean }) {
  return (
    <AppButton onPress={onPress} isLoading={isLoading} icon={<Icon name="save" size={24} color={colors.onPrimary} />}>
      기록 저장하기
    </AppButton>
  );
}
