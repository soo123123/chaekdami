import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Line, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';
const WHEEL_TURN_MS = 3200;
const STRIDE_MS = 460;

const WOOD = '#C98F55';
const WOOD_DARK = '#8E5A2C';
const WOOD_LIGHT = '#E4B680';
const LINE = '#3A3330';
const FUR_PATCH = '#8F8781';

type CatWheelProps = {
  /** 쳇바퀴 지름 (px) */
  size: number;
  /** 타이머가 흐르는 중이면 고양이가 달린다 */
  isRunning: boolean;
};

/**
 * 독서 시작 화면의 '쳇바퀴를 달리는 고양이' 애니메이션.
 * 바퀴는 시계 방향으로 돌고, 고양이는 제자리에서 다리를 번갈아 움직이며 몸을 들썩인다.
 * 일시정지하면 바퀴와 고양이가 멈춘다. (모션 줄이기 설정이 켜져 있으면 움직이지 않는다)
 */
export function CatWheel({ size, isRunning }: CatWheelProps) {
  const spin = useRef(new Animated.Value(0)).current;
  const stride = useRef(new Animated.Value(0.25)).current;
  const reduceMotion = useReduceMotion();
  const shouldAnimate = isRunning && !reduceMotion;

  useEffect(() => {
    if (!shouldAnimate) {
      stride.setValue(0.25); // 네 다리가 모두 곧게 선 자세
      return;
    }
    // 멈췄던 각도에서 이어서 돈다
    let wheelLoop: Animated.CompositeAnimation | null = null;
    spin.stopAnimation(value => {
      const from = value % 1;
      spin.setValue(from);
      const firstTurn = Animated.timing(spin, { toValue: 1, duration: WHEEL_TURN_MS * (1 - from), easing: Easing.linear, useNativeDriver: USE_NATIVE_DRIVER });
      wheelLoop = Animated.sequence([
        firstTurn,
        Animated.loop(
          Animated.sequence([
            Animated.timing(spin, { toValue: 0, duration: 0, useNativeDriver: USE_NATIVE_DRIVER }),
            Animated.timing(spin, { toValue: 1, duration: WHEEL_TURN_MS, easing: Easing.linear, useNativeDriver: USE_NATIVE_DRIVER }),
          ]),
        ),
      ]);
      wheelLoop.start();
    });
    stride.setValue(0);
    const strideLoop = Animated.loop(
      Animated.timing(stride, { toValue: 1, duration: STRIDE_MS, easing: Easing.linear, useNativeDriver: USE_NATIVE_DRIVER }),
    );
    strideLoop.start();
    return () => {
      wheelLoop?.stop();
      spin.stopAnimation();
      strideLoop.stop();
    };
  }, [shouldAnimate, spin, stride]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const catWidth = size * 0.5;
  const catHeight = catWidth * 0.66;

  return (
    <View
      style={{ width: size, height: size * 1.06 }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <WheelStand size={size} />
      <Animated.View style={[styles.layer, { width: size, height: size, transform: [{ rotate }] }]}>
        <WheelRing size={size} />
      </Animated.View>
      <View
        style={[
          styles.layer,
          {
            width: catWidth,
            height: catHeight,
            // 바퀴 안쪽 바닥(지름의 40% 지점)에 발이 닿도록 배치
            left: (size - catWidth) / 2 + size * 0.02,
            top: size * 0.9 - catHeight * 0.93,
          },
        ]}
      >
        <RunningCat width={catWidth} stride={stride} />
      </View>
    </View>
  );
}

function useReduceMotion() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => mounted && setEnabled(value)).catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setEnabled);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);
  return enabled;
}

/* ------------------------------------------------------------------ */
/* 쳇바퀴                                                               */
/* ------------------------------------------------------------------ */

const PLANKS = 40;

/** 회전하는 나무 바퀴 (viewBox 400 기준) */
function WheelRing({ size }: { size: number }) {
  const planks = Array.from({ length: PLANKS }, (_, i) => {
    const angle = (i / PLANKS) * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return { x1: 200 + cos * 163, y1: 200 + sin * 163, x2: 200 + cos * 194, y2: 200 + sin * 194 };
  });
  return (
    <Svg width={size} height={size} viewBox="0 0 400 400">
      <Defs>
        <RadialGradient id="wheel-inside" cx="50%" cy="45%" r="55%">
          <Stop offset="0" stopColor="#FFF6E8" stopOpacity="0.55" />
          <Stop offset="1" stopColor="#F3D9B6" stopOpacity="0.9" />
        </RadialGradient>
      </Defs>
      {/* 바퀴 안쪽(뒤판) */}
      <Circle cx={200} cy={200} r={160} fill="url(#wheel-inside)" />
      {/* 안쪽 원통 면 (깊이감) */}
      <Circle cx={200} cy={206} r={163} fill="none" stroke={WOOD_DARK} strokeOpacity={0.35} strokeWidth={8} />
      {/* 바깥 테두리 */}
      <Circle cx={200} cy={200} r={194} fill="none" stroke={WOOD} strokeWidth={34} />
      {planks.map((p, i) => (
        <Line key={i} {...p} stroke={WOOD_DARK} strokeWidth={1.6} strokeOpacity={0.55} />
      ))}
      <Circle cx={200} cy={200} r={194 + 16} fill="none" stroke={WOOD_DARK} strokeWidth={3} />
      <Circle cx={200} cy={200} r={194 - 16} fill="none" stroke={WOOD_LIGHT} strokeWidth={5} />
      <Circle cx={200} cy={200} r={160} fill="none" stroke={WOOD_DARK} strokeWidth={3} />
      {/* 회전이 보이도록 나뭇결 표시 몇 개 */}
      {[0, 120, 240].map(deg => {
        const a = (deg * Math.PI) / 180;
        return <Circle key={deg} cx={200 + Math.cos(a) * 194} cy={200 + Math.sin(a) * 194} r={4} fill={WOOD_DARK} opacity={0.6} />;
      })}
    </Svg>
  );
}

/** 바퀴를 받치는 받침대 (회전하지 않음) */
function WheelStand({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 1.06} viewBox="0 0 400 424" style={StyleSheet.absoluteFill}>
      <Ellipse cx={200} cy={414} rx={175} ry={9} fill="#7A4E2A" opacity={0.18} />
      {/* 왼쪽 다리 */}
      <Path d="M92 330 L58 410 L92 410 L122 344 Z" fill={WOOD} stroke={WOOD_DARK} strokeWidth={3} strokeLinejoin="round" />
      <Rect x={36} y={404} width={104} height={14} rx={5} fill={WOOD_DARK} />
      {/* 오른쪽 다리 */}
      <Path d="M308 330 L342 410 L308 410 L278 344 Z" fill={WOOD} stroke={WOOD_DARK} strokeWidth={3} strokeLinejoin="round" />
      <Rect x={260} y={404} width={104} height={14} rx={5} fill={WOOD_DARK} />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/* 달리는 고양이 (viewBox 200 x 132)                                     */
/* ------------------------------------------------------------------ */

type Leg = { x: number; y: number; phase: 0 | 1; front: boolean };

const LEGS: Leg[] = [
  { x: 56, y: 92, phase: 1, front: false },
  { x: 128, y: 92, phase: 0, front: false },
  { x: 70, y: 94, phase: 0, front: true },
  { x: 142, y: 94, phase: 1, front: true },
];
const LEG_W = 18;
const LEG_H = 34;

function RunningCat({ width, stride }: { width: number; stride: Animated.Value }) {
  const scale = width / 200;
  const bob = stride.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, -3.5 * scale, 0, -3.5 * scale, 0] });
  const swing = (phase: 0 | 1) =>
    stride.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: phase === 0 ? ['-32deg', '32deg', '-32deg'] : ['32deg', '-32deg', '32deg'],
    });

  const renderLeg = (leg: Leg) => {
    const w = LEG_W * scale;
    const h = LEG_H * scale;
    return (
      <Animated.View
        key={`${leg.x}-${leg.front}`}
        style={[
          styles.layer,
          {
            left: leg.x * scale - w / 2,
            top: leg.y * scale - h * 0.2,
            width: w,
            height: h,
            // 엉덩이(윗부분)를 축으로 흔든다
            transform: [{ translateY: -h * 0.3 }, { rotate: swing(leg.phase) }, { translateY: h * 0.3 }],
          },
        ]}
      >
        <Svg width={w} height={h} viewBox={`0 0 ${LEG_W} ${LEG_H}`}>
          <Rect x={2} y={1} width={LEG_W - 4} height={LEG_H - 3} rx={7} fill={leg.front ? '#FFFFFF' : '#ECE6E1'} stroke={LINE} strokeWidth={2} />
        </Svg>
      </Animated.View>
    );
  };

  return (
    <Animated.View style={{ width, height: width * 0.66, transform: [{ translateY: bob }] }}>
      {LEGS.filter(leg => !leg.front).map(renderLeg)}
      <Svg width={width} height={width * 0.66} viewBox="0 0 200 132" style={StyleSheet.absoluteFill}>
        <Defs>
          <ClipPath id="cat-body">
            <Ellipse cx={98} cy={76} rx={62} ry={36} />
          </ClipPath>
          <ClipPath id="cat-head">
            <Circle cx={152} cy={56} r={31} />
          </ClipPath>
        </Defs>
        {/* 꼬리 */}
        <Path d="M42 70 C 22 62, 14 40, 24 18" fill="none" stroke={LINE} strokeWidth={17} strokeLinecap="round" />
        <Path d="M42 70 C 22 62, 14 40, 24 18" fill="none" stroke="#FFFFFF" strokeWidth={12} strokeLinecap="round" />
        <Path d="M20 36 C 18 28, 20 22, 24 18" fill="none" stroke={FUR_PATCH} strokeWidth={12} strokeLinecap="round" />
        {/* 몸통 */}
        <Ellipse cx={98} cy={76} rx={62} ry={36} fill="#FFFFFF" />
        <G clipPath="url(#cat-body)">
          <Ellipse cx={86} cy={44} rx={34} ry={20} fill={FUR_PATCH} />
          <Ellipse cx={46} cy={70} rx={14} ry={18} fill={FUR_PATCH} />
        </G>
        <Ellipse cx={98} cy={76} rx={62} ry={36} fill="none" stroke={LINE} strokeWidth={2.4} />
        {/* 귀 */}
        <Path d="M128 40 L132 12 L152 28 Z" fill={FUR_PATCH} stroke={LINE} strokeWidth={2.2} strokeLinejoin="round" />
        <Path d="M160 28 L178 12 L180 42 Z" fill="#FFFFFF" stroke={LINE} strokeWidth={2.2} strokeLinejoin="round" />
        <Path d="M164 30 L176 19 L177 38 Z" fill="#F4B9B5" />
        {/* 머리 */}
        <Circle cx={152} cy={56} r={31} fill="#FFFFFF" />
        <G clipPath="url(#cat-head)">
          <Ellipse cx={136} cy={34} rx={20} ry={16} fill={FUR_PATCH} />
        </G>
        <Circle cx={152} cy={56} r={31} fill="none" stroke={LINE} strokeWidth={2.4} />
        {/* 얼굴: 웃는 눈, 볼터치, 입 */}
        <Path d="M140 55 Q 145 50 150 55" fill="none" stroke={LINE} strokeWidth={2.4} strokeLinecap="round" />
        <Path d="M160 53 Q 165 48 170 53" fill="none" stroke={LINE} strokeWidth={2.4} strokeLinecap="round" />
        <Ellipse cx={142} cy={64} rx={5} ry={3} fill="#F6A9A3" opacity={0.8} />
        <Ellipse cx={172} cy={62} rx={5} ry={3} fill="#F6A9A3" opacity={0.8} />
        <Path d="M152 63 Q 155 67 158 63 Q 161 67 164 63" fill="none" stroke={LINE} strokeWidth={1.8} strokeLinecap="round" />
        {/* 초록 스카프 */}
        <Path d="M128 78 Q 148 90 170 80 L 166 88 Q 148 98 130 86 Z" fill="#6E9A6A" stroke="#3F6343" strokeWidth={1.6} />
        <Path d="M150 90 L 144 104 L 156 98 Z" fill="#6E9A6A" stroke="#3F6343" strokeWidth={1.6} strokeLinejoin="round" />
      </Svg>
      {LEGS.filter(leg => leg.front).map(renderLeg)}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', left: 0, top: 0 },
});
