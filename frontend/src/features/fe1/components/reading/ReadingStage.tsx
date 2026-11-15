import { Image } from 'expo-image';
import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { colors, serifFont, softShadow, spacing } from '../../constants/theme';
import { CatWheel } from './CatWheel';

const ROOM = require('../../assets/decor/reading-room.jpg');
/** 배경 이미지 원본 크기. 쳇바퀴·말풍선 위치를 이 비율로 맞춘다. */
const ROOM_W = 798;
const ROOM_H = 834;
const MAX_STAGE_WIDTH = 520;

type ReadingStageProps = {
  isRunning: boolean;
  bubbleText: string;
  /** 타이머 + 조작 버튼. scale은 시안(폭 400pt) 대비 무대 크기 비율 */
  children: (scale: number) => ReactNode;
  backgroundColor?: string;
};

/** 독서 시작 화면의 방 일러스트 + 쳇바퀴 고양이 + 타이머 영역 */
export function ReadingStage({ isRunning, bubbleText, children, backgroundColor = colors.background }: ReadingStageProps) {
  const [width, setWidth] = useState(0);
  const stageWidth = Math.min(width, MAX_STAGE_WIDTH);
  const stageHeight = (stageWidth * ROOM_H) / ROOM_W;
  const px = (x: number) => (x / ROOM_W) * stageWidth;
  const py = (y: number) => (y / ROOM_H) * stageHeight;
  const wheelSize = px(404);

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  return (
    <View style={styles.bleed} onLayout={onLayout}>
      {stageWidth > 0 ? (
        <View style={{ width: stageWidth, height: stageHeight }}>
          <Image source={ROOM} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityIgnoresInvertColors />
          <EdgeFade color={backgroundColor} height={py(70)} position="top" />
          <EdgeFade color={backgroundColor} height={py(60)} position="bottom" />

          <View style={[styles.abs, { left: px(203), top: py(96) }]}>
            <CatWheel size={wheelSize} isRunning={isRunning} />
          </View>

          <View style={[styles.bubbleWrap, { top: py(14) }]}>
            <View style={styles.bubble}>
              <Text style={styles.bubbleText}>{bubbleText}</Text>
            </View>
            <View style={styles.bubbleTail} />
          </View>

          <View style={[styles.controls, { top: py(514), bottom: py(10) }]}>{children(stageWidth / 400)}</View>
        </View>
      ) : null}
    </View>
  );
}

function EdgeFade({ color, height, position }: { color: string; height: number; position: 'top' | 'bottom' }) {
  const id = `stage-fade-${position}`;
  return (
    <Svg
      width="100%"
      height={height}
      style={[styles.abs, { left: 0, right: 0 }, position === 'top' ? { top: 0 } : { bottom: 0 }]}
      pointerEvents="none"
    >
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={position === 'top' ? 1 : 0} />
          <Stop offset="1" stopColor={color} stopOpacity={position === 'top' ? 0 : 1} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height={height} fill={`url(#${id})`} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  bleed: { marginHorizontal: -spacing.md, alignItems: 'center' },
  abs: { position: 'absolute' },
  bubbleWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  bubble: { backgroundColor: 'rgba(255, 252, 247, 0.96)', borderRadius: 22, paddingHorizontal: spacing.lg - 4, paddingVertical: spacing.sm + 2, ...softShadow },
  bubbleTail: { width: 14, height: 14, marginTop: -8, backgroundColor: 'rgba(255, 252, 247, 0.96)', transform: [{ rotate: '45deg' }] },
  bubbleText: { fontFamily: serifFont, fontSize: 15, lineHeight: 23, color: colors.text, textAlign: 'center' },
  controls: { position: 'absolute', left: 0, right: 0, alignItems: 'center', justifyContent: 'space-between' },
});
