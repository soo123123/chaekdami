import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

const CAT_READING = require('../../assets/decor/cat-reading.webp');
/** cat-reading.webp 원본 크기 (배경 제거 후 여백을 잘라낸 크기) */
export const READING_CAT_W = 291;
export const READING_CAT_H = 247;

type ReadingCatProps = {
  /** 표시 너비 (px). 높이는 원본 비율로 계산한다 */
  width: number;
  /** 타이머가 흐르는 중이면 애니메이션을 재생한다 */
  isRunning: boolean;
};

/**
 * 독서 시작 화면의 '독서에 열중하는 고양이' 애니메이션 (투명 배경 animated WebP).
 * 일시정지하면 애니메이션도 멈춘다. (모션 줄이기 설정이 켜져 있으면 움직이지 않는다)
 */
export function ReadingCat({ width, isRunning }: ReadingCatProps) {
  const imageRef = useRef<Image>(null);
  const reduceMotion = useReduceMotion();
  const shouldAnimate = isRunning && !reduceMotion;

  // 첫 렌더에서는 autoplay prop이 재생 여부를 정하므로, 그 뒤 값이 바뀔 때만 명령을 보낸다.
  // 네이티브 뷰가 아직 준비 전이거나 이미 사라진 순간(마운트 직후, 집중 모드 전환, 화면 이탈)에는
  // 명령이 ViewNotFound로 실패하는데, 이때는 할 일이 없으므로 조용히 무시한다.
  const isFirstRunRef = useRef(true);
  useEffect(() => {
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false;
      return;
    }
    const image = imageRef.current;
    if (!image) return;
    const command = shouldAnimate ? image.startAnimating() : image.stopAnimating();
    command.catch(() => {});
  }, [shouldAnimate]);

  return (
    <Image
      ref={imageRef}
      source={CAT_READING}
      autoplay={shouldAnimate}
      style={{ width, height: (width * READING_CAT_H) / READING_CAT_W }}
      contentFit="contain"
      accessibilityLabel="머리띠를 두르고 독서에 열중하는 고양이"
      accessibilityIgnoresInvertColors
    />
  );
}

function useReduceMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then(value => mounted && setReduceMotion(value))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);
  return reduceMotion;
}
