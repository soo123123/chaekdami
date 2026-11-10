import { Stack } from 'expo-router';

/**
 * FE1 화면 공통 레이아웃.
 * 하단 탭바는 레이아웃이 아니라 서재 화면 안에 붙어 있다.
 * (레이아웃에 두면 다른 화면으로 넘어갈 때 탭바가 사라지면서 서재 높이가 바뀌어 책장이 커졌다 작아진다)
 */
export default function FE1Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* 탭 화면(서재 / 커뮤니티)은 슬라이드 없이 바로 바꾼다 */}
      <Stack.Screen name="library" options={{ animation: 'none' }} />
      <Stack.Screen name="community" options={{ animation: 'none' }} />
    </Stack>
  );
}
