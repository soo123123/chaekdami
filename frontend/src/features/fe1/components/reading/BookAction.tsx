import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '../../constants/theme';
import { AppButton } from '../common/AppButton';
import { Icon } from '../common/Icon';

type BookActionProps = {
  onRemove: () => void;
  onStartReading: () => void;
  /** 완독한 책이면 '다시 읽기'로 표시한다 */
  isCompleted?: boolean;
};

/** 책 상세 하단의 책 제거 / 독서 시작 버튼 */
export function BookAction({ onRemove, onStartReading, isCompleted = false }: BookActionProps) {
  return (
    <View style={styles.row}>
      <View style={styles.remove}>
        <AppButton variant="dangerOutline" onPress={onRemove} icon={<Icon name="trash" size={24} color={colors.danger} />}>
          책 제거
        </AppButton>
      </View>
      <View style={styles.start}>
        <AppButton onPress={onStartReading} icon={<Icon name="bookOpen" size={26} color={colors.onPrimary} />}>
          {isCompleted ? '다시 읽기' : '독서 시작'}
        </AppButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm + 4 },
  remove: { flex: 1 },
  start: { flex: 1.1 },
});
