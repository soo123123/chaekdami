
import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { ToastHost } from '@/components/Toast';
import { getFocusedRouteNameFromRoute } from 'expo-router/react-navigation';

import BoosterFloatingWidget from '@/features/fe2/components/BoosterFloatingWidget';

/**
 * 하단 탭바로 오가는 화면 (홈 / 서재 / 커뮤니티 / 랭킹 / 마이페이지).
 * key: 최상위 Stack의 라우트 이름
 * value: 그 안의 탭 화면 이름
 * 빈 배열 = 라우트 자체가 탭 화면
 *
 * 탭 화면을 추가하면 BottomTabBar의 TABS와
 * 함께 여기도 추가한다.
 */
const TAB_SCREENS: Record<string, string[]> = {
  index: [],
  fe1: ['library', 'community', 'ranking'],
  fe2: ['user/mypage'],
};

type StackRoute = {
  name: string;
  params?: object;
};

/**
 * 최상위 라우트가 현재 탭 화면을
 * 보여주고 있는지 확인한다.
 */
function isTabScreen(route: StackRoute): boolean {
  const tabs = TAB_SCREENS[route.name];

  if (!tabs) {
    return false;
  }

  if (tabs.length === 0) {
    return true;
  }

  const child =
    getFocusedRouteNameFromRoute(
      route as Parameters<
        typeof getFocusedRouteNameFromRoute
      >[0]
    ) ??
    (
      route.params as
        | { screen?: string }
        | undefined
    )?.screen;

  return (
    child !== undefined &&
    tabs.includes(child)
  );
}

export default function RootLayout() {
  return (
    <View style={styles.container}>
      <Stack
        screenOptions={({ route }) => ({
          headerShown: false,

          // 탭 화면 간 이동은 애니메이션 없이 전환한다.
          // 상세 화면 이동은 기존 애니메이션을 유지한다.
          animation: isTabScreen(route)
            ? 'none'
            : 'default',
        })}
      />

      {/* 모든 화면에서 공통으로 사용하는 부스터 위젯 */}
      <BoosterFloatingWidget />

      {/* 앱 공용 상단 토스트 */}
      <ToastHost />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
