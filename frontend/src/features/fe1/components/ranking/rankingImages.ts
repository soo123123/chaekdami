/** 랭킹 화면 이미지. 은·동 메달은 stats-medal.png의 색만 바꾼 것이다. */
export const RANKING_IMAGES = {
  hero: require('../../../../../assets/images/level/level-reading-cat.png'),
  profile: require('../../../../../assets/images/mypage/profile-cat.png'),
  empty: require('../../../../../assets/images/mypage/sleeping-cat.png'),
  readingTime: require('../../../../../assets/images/level/level-clock.png'),
  experience: require('../../../../../assets/images/shop/shop-exp-1.png'),
};

const MEDALS: Record<number, number> = {
  1: require('../../../../../assets/images/stats/stats-medal.png'),
  2: require('../../assets/ranking/medal-silver.png'),
  3: require('../../assets/ranking/medal-bronze.png'),
};

/** 1~3위 메달. 서버가 준 순위로 고른다 (공동 2위면 은메달 2개) */
export function medalFor(rank: number): number | undefined {
  return MEDALS[rank];
}
