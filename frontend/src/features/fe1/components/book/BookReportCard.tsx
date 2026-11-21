import { Pressable, StyleSheet, Text } from 'react-native';
import { WriteReviewButton } from '@/features/fe2/components/readingComplete/WriteReviewButton';
import { HIT_SLOP } from '@/constants/layout';
import { colors } from '../../constants/theme';
import type { ReadingRound } from '../../types/reading';
import { Card } from '../common/Card';
import { Icon } from '../common/Icon';

type Props = {
  currentRound: ReadingRound;
  canWrite: boolean;
  hasReport: boolean;
  remainingPages: number | null;
  /** 현재 회차 말고 완독한 회차가 있을 때만 '모두 보기'를 보여준다 */
  showAll: boolean;
  onWrite: () => void;
  onOpen: () => void;
  onShowAll: () => void;
};

/**
 * 책 상세의 독후감 카드.
 * 현재 회차 버튼은 독서 완료 화면의 WriteReviewButton(FE2)을 그대로 쓴다 — 읽는 중이면 비활성, 완독이면 작성/보기.
 */
export function BookReportCard({ currentRound, canWrite, hasReport, remainingPages, showAll, onWrite, onOpen, onShowAll }: Props) {
  return (
    <Card
      title="독후감"
      right={showAll ? (
        <Pressable accessibilityRole="button" accessibilityLabel="독후감 모두 보기" hitSlop={HIT_SLOP} onPress={onShowAll} style={styles.moreButton}>
          <Text style={styles.more}>모두 보기</Text>
          <Icon name="chevronRight" size={16} color={colors.secondaryText} />
        </Pressable>
      ) : undefined}
    >
      <WriteReviewButton
        review={{ canWrite, hasReport, remainingPages }}
        round={currentRound.round}
        onWrite={onWrite}
        onOpen={onOpen}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  moreButton: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  more: { fontSize: 14, color: colors.secondaryText },
});
