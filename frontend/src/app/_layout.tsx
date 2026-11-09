import { Stack } from 'expo-router';
import { View } from 'react-native';
import { ToastHost } from '@/components/Toast';
import { getFocusedRouteNameFromRoute } from 'expo-router/react-navigation';

/**
 * 하단 탭바로 오가는 화면 (홈 / 서재 / 마이페이지).
 * key: 최상위 Stack의 라우트 이름, value: 그 안의 탭 화면 이름 (빈 배열 = 라우트 자체가 탭 화면)
 * 탭 화면을 추가하면 BottomTabBar의 TABS와 함께 여기도 추가한다.
 */
const TAB_SCREENS: Record<string, string[]> = {
  index: [],
  fe1: ['library'],
  fe2: ['user/mypage'],
};

type StackRoute = { name: string; params?: object };

/** 최상위 라우트가 지금 탭 화면을 보여주고 있는지 */
function isTabScreen(route: StackRoute): boolean {
  const tabs = TAB_SCREENS[route.name];
  if (!tabs) return false;
  if (tabs.length === 0) return true;
  // 하위 Stack이 이미 그려졌으면 현재 화면, 아직이면 이동할 때 지정된 화면으로 판단한다
  const child =
    getFocusedRouteNameFromRoute(route as Parameters<typeof getFocusedRouteNameFromRoute>[0]) ??
    (route.params as { screen?: string } | undefined)?.screen;
  return child !== undefined && tabs.includes(child);
}

export default function RootLayout() {
  return (
    <View style={{ flex: 1 }}>
    <Stack
      screenOptions={({ route }) => ({
        headerShown: false,
        // 탭 화면끼리 이동(탭바 클릭)할 때는 슬라이드 없이 바로 바꾼다.
        // 탭 화면에서 상세 화면으로 들어가는 이동은 기존 애니메이션을 유지한다.
        animation: isTabScreen(route) ? 'none' : 'default',
      })}
    />
      {/* 앱 공용 상단 토스트 (showToast) */}
      <ToastHost />
    </View>
  );
}
