import { StyleSheet, Switch, Text, View } from 'react-native';
import { colors, radius, softShadow, spacing } from '../../constants/theme';
import { Icon } from '../common/Icon';

type PublicSettingProps = { isPublic: boolean; onChange: (isPublic: boolean) => void };

export function PublicSetting({ isPublic, onChange }: PublicSettingProps) {
  return (
    <View style={styles.container}>
      <Icon name="globe" size={34} color={colors.text} />
      <View style={styles.text}>
        <Text style={styles.title}>공개 설정</Text>
        <Text style={styles.desc}>다른 사용자에게 이 책을 공개합니다.</Text>
      </View>
      <Switch
        value={isPublic}
        onValueChange={onChange}
        trackColor={{ true: colors.primary, false: colors.progressTrack }}
        thumbColor="#FFFFFF"
        accessibilityLabel="공개 설정"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: 'rgba(236, 227, 216, 0.6)', paddingVertical: spacing.md, paddingHorizontal: spacing.md + 4, ...softShadow },
  text: { flex: 1, gap: 2 },
  title: { fontSize: 17, fontWeight: '800', color: colors.text },
  desc: { fontSize: 13, color: colors.secondaryText },
});
