import type { ImageSourcePropType } from 'react-native';

/**
 * 서재 꾸미기 화면의 테마 썸네일·대표 이미지.
 * 실제 서재 구성(배경 + 책장 틀 + 칸 뒷판)으로 만든 미리보기 이미지다.
 */
export const THEME_THUMBNAILS: Record<string, ImageSourcePropType> = {
  'warm-sunlight': require('../assets/themes/warm-sunlight.jpg'),
  'cosmic-night': require('../assets/themes/cosmic-night.jpg'),
  'neon-city': require('../assets/themes/neon-city.jpg'),
};

/** 대표 이미지가 따로 있으면 사용하고, 없으면 썸네일을 쓴다. */
const THEME_HEROES: Record<string, ImageSourcePropType> = {
  'warm-sunlight': require('../assets/themes/warm-sunlight-hero.jpg'),
  'cosmic-night': require('../assets/themes/cosmic-night-hero.jpg'),
  'neon-city': require('../assets/themes/neon-city-hero.jpg'),
};

export function themeHeroImage(themeId: string): ImageSourcePropType | undefined {
  return THEME_HEROES[themeId] ?? THEME_THUMBNAILS[themeId];
}
