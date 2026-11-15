import type { ImageSourcePropType } from 'react-native';

/**
 * 서재 테마 일러스트 (시안 이미지에서 잘라낸 임시 에셋).
 * 디자이너 원본 에셋이 준비되면 같은 이름으로 교체한다.
 */
export const THEME_THUMBNAILS: Record<string, ImageSourcePropType> = {
  'warm-sunlight': require('../assets/themes/warm-sunlight.jpg'),
  'starry-night': require('../assets/themes/starry-night.jpg'),
  'white-garden': require('../assets/themes/white-garden.jpg'),
  'vintage-brown': require('../assets/themes/vintage-brown.jpg'),
  'modern-beige': require('../assets/themes/modern-beige.jpg'),
  'forest-rest': require('../assets/themes/forest-rest.jpg'),
  'lavender-dream': require('../assets/themes/lavender-dream.jpg'),
  'monotone-gray': require('../assets/themes/monotone-gray.jpg'),
};

/** 대표 이미지가 따로 있으면 사용하고, 없으면 썸네일을 쓴다. */
const THEME_HEROES: Record<string, ImageSourcePropType> = {
  'warm-sunlight': require('../assets/themes/warm-sunlight-hero.jpg'),
};

export function themeHeroImage(themeId: string): ImageSourcePropType | undefined {
  return THEME_HEROES[themeId] ?? THEME_THUMBNAILS[themeId];
}
