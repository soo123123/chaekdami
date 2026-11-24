
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  AppState,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { usePathname } from 'expo-router';

import {
  getRewardStatus,
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

type Position = {
  x: number;
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

  const isTestMode = __DEV__ && TEST_MODE;

  const maxX = Math.max(
    EDGE_MARGIN,
    width - WIDGET_SIZE - EDGE_MARGIN
  );

  const maxY = Math.max(
    EDGE_MARGIN,
    height - WIDGET_SIZE - EDGE_MARGIN
  );

  const [position, setPosition] = useState<Position>(
    () => ({
      x: maxX,
      y: clamp(
        INITIAL_TOP,
        EDGE_MARGIN,
        maxY
      ),
    })
  );

  const positionRef = useRef(position);
  const boundsRef = useRef({ maxX, maxY });
  const dragStartRef = useRef(position);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  const testExpirationRef = useRef<number>(
    Date.now() +
      TEST_DURATION_MINUTES * 60 * 1000
  );

  const [expiration, setExpiration] = useState<
    number | null
  >(
    isTestMode
      ? testExpirationRef.current
      : null
  );

  const [remaining, setRemaining] = useState(
    isTestMode
      ? Math.max(
          0,
          testExpirationRef.current - Date.now()
        )
      : 0
  );

  const updatePosition = useCallback(
    (next: Position) => {
      const bounds = boundsRef.current;

      const adjusted: Position = {
        x: clamp(
          next.x,
          EDGE_MARGIN,
          bounds.maxX
        ),
        y: clamp(
          next.y,
          EDGE_MARGIN,
          bounds.maxY
        ),
      };

      positionRef.current = adjusted;
      setPosition(adjusted);
    },
    []
  );

  useEffect(() => {
    boundsRef.current = { maxX, maxY };

    updatePosition(positionRef.current);
  }, [maxX, maxY, updatePosition]);

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
        setExpiration(null);
        setRemaining(0);
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
        setRemaining(
          Math.max(
            0,
            nextExpiration - Date.now()
          )
        );
      } else {
        setExpiration(null);
        setRemaining(0);
      }
    } catch (error) {
      console.warn(
        '[BoosterFloatingWidget] 보상 상태 조회 실패:',
        error
      );
    }
  }, [isTestMode]);

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
    void refreshReward();
  }, [pathname, refreshReward]);

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
      setRemaining(0);
      return;
    }

    const updateRemaining = () => {
      const nextRemaining = Math.max(
        0,
        expiration - Date.now()
      );

      setRemaining(nextRemaining);

      if (nextRemaining <= 0) {
        setExpiration(null);
      }
    };

    updateRemaining();

    const interval = setInterval(
      updateRemaining,
      1000
    );

    return () => {
      clearInterval(interval);
    };
  }, [expiration]);

  /**
   * 터치 및 마우스 드래그
   */
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,

      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        dragStartRef.current = {
          ...positionRef.current,
        };
      },

      onPanResponderMove: (_, gesture) => {
        updatePosition({
          x: dragStartRef.current.x + gesture.dx,
          y: dragStartRef.current.y + gesture.dy,
        });
      },

      onPanResponderRelease: () => {
        // 현재 위치 유지
      },

      onPanResponderTerminationRequest: () =>
        false,
    })
  ).current;

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
        {...panResponder.panHandlers}
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
