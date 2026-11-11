/** 독서 완료 화면 색·이미지 (UI 시안 기준) */

export const COMPLETE_COLORS = {
  background: '#FBF8F3',
  card: '#FFFFFF',
  border: '#EFE7DC',
  text: '#2B2925',
  secondary: '#8C877F',
  green: '#3F5E4A',
  title: '#4E7556',
  paleGreen: '#EEF2EA',
  track: '#E6E4DF',
  pill: '#ECF1E8',
  cream: '#F8EBD6',
  creamBorder: '#F1DFC2',
  brown: '#9A6A2F',
  gold: '#E2B44D',
  greyButton: '#EDEAE4',
} as const;

/**
 * 임시 이미지: FE2 원본이 오기 전까지 FE2 다른 화면 이미지를 복사해 둔 것.
 * 원본이 오면 assets/images/reading-complete/ 아래 같은 이름으로 덮어쓴다.
 */
export const COMPLETE_IMAGES = {
  bannerCat: require('../../../../../assets/images/reading-complete/complete-banner-cat.png'),
  flame: require('../../../../../assets/images/reading-complete/complete-flame.png'),
  sprout: require('../../../../../assets/images/reading-complete/complete-sprout.png'),
  coin: require('../../../../../assets/images/reading-complete/complete-coin.png'),
  questCat: require('../../../../../assets/images/reading-complete/complete-quest-cat.png'),
  books: require('../../../../../assets/images/reading-complete/complete-books.png'),
};

export const cardStyle = {
  backgroundColor: COMPLETE_COLORS.card,
  borderRadius: 22,
  borderWidth: 1,
  borderColor: COMPLETE_COLORS.border,
  shadowColor: '#5B4A32',
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 2,
} as const;
