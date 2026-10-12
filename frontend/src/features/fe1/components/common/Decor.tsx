import { Image } from 'expo-image';
import { StyleSheet, type ImageStyle, type StyleProp } from 'react-native';

const CAT_BOOKS_PLANT = require('../../assets/decor/cat-books-plant.png');
const CAT_BOOKS_PLANT_RATIO = 332 / 304;

const READING_END_SCENE = require('../../assets/decor/reading-end-scene.png');
const READING_END_SCENE_RATIO = 543 / 234;

type DecorProps = { width: number; style?: StyleProp<ImageStyle> };

/** 책 더미 위에서 자는 고양이 + 화분 (장식용 일러스트) */
export function CatBooksDecor({ width, style }: DecorProps) {
  return (
    <Image
      source={CAT_BOOKS_PLANT}
      style={[styles.decor, { width, height: width / CAT_BOOKS_PLANT_RATIO }, style]}
      contentFit="contain"
      accessible={false}
      pointerEvents="none"
    />
  );
}

/** 독서 종료 화면 상단의 창가 장면 (장식용 일러스트) */
export function ReadingEndSceneDecor({ width, style }: DecorProps) {
  return (
    <Image
      source={READING_END_SCENE}
      style={[styles.decor, { width, height: width / READING_END_SCENE_RATIO }, style]}
      contentFit="cover"
      accessible={false}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  decor: { position: 'absolute' },
});
