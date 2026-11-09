import Ionicons from '@expo/vector-icons/Ionicons';
import { router, usePathname, type Href } from 'expo-router';
import { useEffect, useState, type ComponentProps } from 'react';
import { ROUTES } from '@/constants/routes';
import { Keyboard, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * 앱 공용 하단 탭바 (홈 / 서재 / 커뮤니티 / 마이페이지).
 *
 * 최상위 레이아웃(src/app/_layout.tsx)을 탭 구조로 바꾸기 전까지,
 * 각 영역의 레이아웃이나 화면 맨 아래에 붙여서 쓴다.
 *   - FE1: 서재 화면(LibraryScreen) 맨 아래에 표시 (화면 안에 두어야 전환 시 레이아웃이 흔들리지 않음)
 *   - FE2: 원하는 화면/레이아웃 맨 아래에 <BottomTabBar active="mypage" /> 한 줄 추가
 *
 * 탭을 눌렀을 때 이동할 경로는 아래 TABS의 href 한 곳에서 관리한다 (경로 값은 src/constants/routes.ts).
 * href가 null인 탭은 아직 연결 전이라 눌러도 이동하지 않는다 (버튼 동작·눌림 표시는 유지).
 */
export type BottomTabKey = 'home' | 'library' | 'community' | 'mypage';

type IonName = ComponentProps<typeof Ionicons>['name'];
type TabConfig = { key: BottomTabKey; label: string; icon: IonName; activeIcon: IonName; href: Href | null };

const TABS: TabConfig[] = [
  { key: 'home', label: '홈', icon: 'home-outline', activeIcon: 'home', href: ROUTES.home },
  { key: 'library', label: '서재', icon: 'book-outline', activeIcon: 'book', href: ROUTES.fe1.library },
  // 커뮤니티 화면 없음
  { key: 'community', label: '커뮤니티', icon: 'chatbubble-outline', activeIcon: 'chatbubble', href: null },
  { key: 'mypage', label: '마이페이지', icon: 'person-outline', activeIcon: 'person', href: ROUTES.fe2.mypage },
];

const ACTIVE_COLOR = '#467459';
const INACTIVE_COLOR = '#3A3A3A';
/** 홈 인디케이터를 제외한 탭바 높이 */
export const BOTTOM_TAB_BAR_HEIGHT = 64;

type BottomTabBarProps = { active: BottomTabKey };

export function BottomTabBar({ active }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const isKeyboardVisible = useKeyboardVisible();

  // 키보드가 올라와 있을 때는 입력 영역을 가리지 않도록 숨긴다
  if (isKeyboardVisible) return null;

  const handlePress = (tab: TabConfig) => {
    if (!tab.href || pathname === tab.href) return;
    // 같은 영역 안에서 쌓인 화면을 정리하고 탭 첫 화면으로 돌아간다 (스택에 없으면 교체)
    router.dismissTo(tab.href);
  };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]} accessibilityRole="tablist">
      {TABS.map(tab => {
        const isActive = tab.key === active;
        const color = isActive ? ACTIVE_COLOR : INACTIVE_COLOR;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
            onPress={() => handlePress(tab)}
            style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
          >
            <Ionicons name={isActive ? tab.activeIcon : tab.icon} size={26} color={color} />
            <Text style={[styles.label, { color }, isActive && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, () => setVisible(true));
    const hide = Keyboard.addListener(hideEvent, () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return visible;
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    paddingTop: 8,
    backgroundColor: '#FFFCF7',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },
  tab: { flex: 1, minHeight: BOTTOM_TAB_BAR_HEIGHT - 8, alignItems: 'center', justifyContent: 'center', gap: 4 },
  pressed: { opacity: 0.55 },
  label: { fontSize: 13, fontWeight: '500' },
  labelActive: { fontWeight: '700' },
});
