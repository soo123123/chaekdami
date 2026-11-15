import { StyleSheet, Text, View } from 'react-native';

/** 아바타 이미지가 정해지기 전까지 쓰는 닉네임 첫 글자 원형 아바타 */
const PALETTE = [
  { bg: '#F6E3CC', fg: '#8E5F35' },
  { bg: '#E3ECDF', fg: '#2B5B41' },
  { bg: '#F8DCD3', fg: '#A8452E' },
  { bg: '#E6E1F0', fg: '#5A4C7A' },
  { bg: '#DCE8F2', fg: '#2F5677' },
  { bg: '#F4EBC9', fg: '#7A6420' },
];

export function InitialAvatar({ userId, nickname, size = 48 }: { userId: number; nickname: string; size?: number }) {
  const color = PALETTE[Math.abs(userId) % PALETTE.length];
  const initial = Array.from(nickname.trim())[0]?.toUpperCase() ?? '?';
  return (
    <View
      accessibilityLabel={`${nickname} 프로필`}
      style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: color.bg }]}
    >
      <Text style={[styles.initial, { color: color.fg, fontSize: Math.round(size * 0.42) }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  initial: { fontWeight: '800' },
});
