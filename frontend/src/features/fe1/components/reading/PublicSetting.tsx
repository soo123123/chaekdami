import { StyleSheet, Switch, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';

type PublicSettingProps = { isPublic: boolean; onChange: (isPublic: boolean) => void };

export function PublicSetting({ isPublic, onChange }: PublicSettingProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🌐</Text>
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
  container: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  icon: { fontSize: 26 },
  text: { flex: 1, gap: 2 },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  desc: { fontSize: 13, color: colors.secondaryText },
});
