
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  AppState,
  Image,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type GestureResponderEvent,
} from 'react-native';
import { usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BOTTOM_TAB_BAR_HEIGHT } from '@/components/BottomTabBar';
import { ROUTES } from '@/constants/routes';
import {
  getRewardStatus,
  subscribeBoosterUsed,
  type RewardStatusView,
} from '@/features/fe2/api/rewardApi';
import { getAccessToken } from '@/utils/tokenStorage';

/**
 * 개발 전용 테스트 모드
 *
 * true  : 실제 부스터 없이 5분 동안 표시
 * false : 실제 서버 API 결과 사용
 */
const TEST_MODE = false;
const TEST_DURATION_MINUTES = 5;

const BLUE_FLAME_IMAGE = require(
  '../../../../assets/images/blue-flame.png'
);

const WIDGET_SIZE = 76;
const EDGE_MARGIN = 12;
const INITIAL_TOP = 120;
const REFRESH_INTERVAL = 30000;

// 하단 탭바가 있는 화면 (탭을 추가하면 BottomTabBar의 TABS와 함께 추가한다)
const TAB_BAR_PATHS: string[] = [
  ROUTES.home,
  '/home',
  ROUTES.fe1.library,
  ROUTES.fe1.community,
  ROUTES.fe2.mypage,
];

type Position = {
  x: number;
  y: number;
};

// 손을 뗀 위젯이 붙어 있는 가장자리와 높이
type Anchor = {
  side: 'left' | 'right';
  y: number;
};

function clamp(
  value: number,
  minimum: number,
  maximum: number
): number {
  return Math.min(
    Math.max(value, minimum),
    maximum
  );
}

function parseExpiration(
  value: string | null | undefined
): number | null {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();

  if (!Number.isFinite(timestamp)) {
    return null;
  }

  return timestamp;
}

function formatRemainingTime(
  milliseconds: number
): string {
  const totalSeconds = Math.max(
    0,
    Math.ceil(milliseconds / 1000)
  );

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );
  const seconds = totalSeconds % 60;

  const pad = (number: number) =>
    String(number).padStart(2, '0');

  if (hours > 0) {
    return (
      `${pad(hours)}:` +
      `${pad(minutes)}:` +
      `${pad(seconds)}`
    );
  }

  return `${pad(minutes)}:${pad(seconds)}`;
}

export default function BoosterFloatingWidget() {
  const pathname = usePathname();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isTestMode = __DEV__ && TEST_MODE;

  // 노치·제스처 바를 뺀 안전 영역 안에서만 움직인다
  // 하단 탭바가 있는 화면에서는 탭바 위까지만 움직인다
  const bottomInset = TAB_BAR_PATHS.includes(pathname)
    ? BOTTOM_TAB_BAR_HEIGHT + Math.max(insets.bottom, 8)
    : insets.bottom;

  const minX = insets.left + EDGE_MARGIN;
  const minY = insets.top + EDGE_MARGIN;

  const maxX = Math.max(
    minX,
    width - insets.right - WIDGET_SIZE - EDGE_MARGIN
  );

  const maxY = Math.max(
    minY,
    height - bottomInset - WIDGET_SIZE - EDGE_MARGIN
  );

  const clampPosition = (next: Position): Position => ({
    x: clamp(next.x, minX, maxX),
    y: clamp(next.y, minY, maxY),
  });

  const [anchor, setAnchor] = useState<Anchor>({
    side: 'right',
    y: INITIAL_TOP,
  });

  // 끄는 동안의 위치 (끌지 않으면 null)
  const [drag, setDrag] = useState<Position | null>(null);

  // 화면이나 이동 범위가 바뀌어도 항상 범위 안에 그린다
  const position = clampPosition(
    drag ?? {
      x: anchor.side === 'left' ? minX : maxX,
      y: anchor.y,
    }
  );

  const dragStartRef = useRef<{
    touch: Position;
    position: Position;
    moved: boolean;
  } | null>(null);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  const [expiration, setExpiration] = useState<
    number | null
  >(() =>
    isTestMode
      ? Date.now() + TEST_DURATION_MINUTES * 60 * 1000
      : null
  );

  const [now, setNow] = useState(() => Date.now());

  const remaining =
    expiration === null
      ? 0
      : Math.max(0, expiration - now);

  const hideWidget = useCallback(() => {
    setExpiration(null);
    setDrag(null);
  }, []);

  /**
   * 실제 서버에서 부스터 상태 조회
   */
  const refreshReward = useCallback(async () => {
    if (isTestMode) {
      return;
    }

    const requestId = ++requestIdRef.current;

    try {
      const accessToken = await getAccessToken();

      if (
        !mountedRef.current ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      // 로그인 전이나 로그아웃 후에는 조회하지 않고 위젯을 숨긴다
      if (!accessToken) {
        hideWidget();
        return;
      }

      const reward: RewardStatusView =
        await getRewardStatus();

      if (
        !mountedRef.current ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      const nextExpiration = reward.expBuffActive
        ? parseExpiration(reward.expBuffExpiredAt)
        : null;

      if (
        nextExpiration !== null &&
        nextExpiration > Date.now()
      ) {
        setExpiration(nextExpiration);
        setNow(Date.now());
      } else {
        hideWidget();
      }
    } catch (error) {
      console.warn(
        '[BoosterFloatingWidget] 보상 상태 조회 실패:',
        error
      );
    }
  }, [isTestMode, hideWidget]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, []);

  /**
   * 화면 전환 시 상태 동기화
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      void refreshReward();
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [pathname, refreshReward]);

  /**
   * 부스터를 쓴 직후 상태 갱신
   */
  useEffect(
    () =>
      subscribeBoosterUsed(() => {
        void refreshReward();
      }),
    [refreshReward]
  );

  /**
   * 30초마다 서버 상태 갱신
   */
  useEffect(() => {
    if (isTestMode) {
      return;
    }

    const interval = setInterval(() => {
      void refreshReward();
    }, REFRESH_INTERVAL);

    return () => {
      clearInterval(interval);
    };
  }, [isTestMode, refreshReward]);

  /**
   * 앱이 활성화될 때 서버 상태 확인
   */
  useEffect(() => {
    if (isTestMode) {
      return;
    }

    const subscription = AppState.addEventListener(
      'change',
      (state) => {
        if (state === 'active') {
          void refreshReward();
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, [isTestMode, refreshReward]);

  /**
   * 남은 시간 카운트다운
   */
  useEffect(() => {
    if (expiration === null) {
      return;
    }

    const interval = setInterval(() => {
      const current = Date.now();

      setNow(current);

      if (current >= expiration) {
        hideWidget();
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [expiration, hideWidget]);

  /**
   * 터치 및 마우스 드래그
   */
  const draggedPosition = (
    event: GestureResponderEvent
  ): Position | null => {
    const start = dragStartRef.current;

    if (!start) {
      return null;
    }

    const { pageX, pageY } = event.nativeEvent;

    return clampPosition({
      x: start.position.x + pageX - start.touch.x,
      y: start.position.y + pageY - start.touch.y,
    });
  };

  const handleDragStart = (event: GestureResponderEvent) => {
    const { pageX, pageY } = event.nativeEvent;

    dragStartRef.current = {
      touch: { x: pageX, y: pageY },
      position,
      moved: false,
    };
  };

  const handleDragMove = (event: GestureResponderEvent) => {
    const next = draggedPosition(event);

    if (!next || !dragStartRef.current) {
      return;
    }

    dragStartRef.current.moved = true;
    setDrag(next);
  };

  // 손을 떼면 가까운 좌우 가장자리로 붙인다 (세로 위치는 유지)
  const handleDragEnd = () => {
    if (dragStartRef.current?.moved) {
      setAnchor({
        side:
          position.x + WIDGET_SIZE / 2 < width / 2
            ? 'left'
            : 'right',
        y: position.y,
      });
    }

    dragStartRef.current = null;
    setDrag(null);
  };

  const isActive =
    expiration !== null &&
    remaining > 0;

  if (!isActive) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={StyleSheet.absoluteFill}
    >
      <View
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={handleDragStart}
        onResponderMove={handleDragMove}
        onResponderRelease={handleDragEnd}
        onResponderTerminate={handleDragEnd}
        onResponderTerminationRequest={() => false}
        style={[
          styles.widget,
          {
            left: position.x,
            top: position.y,
          },
        ]}
      >
        <View style={styles.circle}>
          <Image
            source={BLUE_FLAME_IMAGE}
            style={styles.flameImage}
            resizeMode="contain"
          />

          <Text
            style={styles.timer}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatRemainingTime(remaining)}
          </Text>

          {isTestMode && (
            <Text style={styles.testLabel}>
              TEST
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  widget: {
    position: 'absolute',
    width: WIDGET_SIZE,
    height: WIDGET_SIZE,
    zIndex: 9999,
    elevation: 20,
  },

  circle: {
    width: WIDGET_SIZE,
    height: WIDGET_SIZE,
    borderRadius: WIDGET_SIZE / 2,
    backgroundColor: '#EAF7FF',
    borderWidth: 1.5,
    borderColor: '#A5D9F5',
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#407FB0',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 8,
  },

  flameImage: {
    width: 45,
    height: 45,
    marginTop: -5,
    marginBottom: -4,
  },

  timer: {
    color: '#245B88',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },

  testLabel: {
    color: '#6799BA',
    fontSize: 7,
    fontWeight: '700',
    marginTop: 1,
    letterSpacing: 0.5,
  },
});
