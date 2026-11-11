import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ROUTES, toReadingStart, toReviewDetail, toReviewWrite } from '@/constants/routes';
import { CompleteActions } from '../components/readingComplete/CompleteActions';
import { CompleteBanner } from '../components/readingComplete/CompleteBanner';
import { QuestProgressCard } from '../components/readingComplete/QuestProgressCard';
import { ReadingResultCard } from '../components/readingComplete/ReadingResultCard';
import { RewardCoinCard } from '../components/readingComplete/RewardCoinCard';
import { StreakLevelCard } from '../components/readingComplete/StreakLevelCard';
import { COMPLETE_COLORS } from '../components/readingComplete/theme';
import { WriteReviewButton } from '../components/readingComplete/WriteReviewButton';
import { useReadingComplete } from '../hooks/useReadingComplete';

/**
 * 독서 완료 화면 (UI 시안: ReadingCompleteScreen.png)
 * 독서 종료(FE1)에서 기록 저장 성공 후 router.replace로 들어온다.
 * 데이터 조립은 useReadingComplete, 각 구역은 components/readingComplete에 있다.
 */
export default function ReadingCompleteScreen() {
  const insets = useSafeAreaInsets();
  const { params, data } = useReadingComplete();

  // 홈 위에 쌓인 화면(서재·책 상세 등)을 모두 닫고 홈으로 간다
  const goHome = () => router.dismissTo(ROUTES.home);

  // 같은 책으로 독서를 다시 시작한다. 책 정보가 없으면 홈으로 간다.
  const continueReading = () => {
    if (params.bookId !== null) {
      router.replace(toReadingStart(params.bookId));
    } else {
      goHome();
    }
  };

  // 독후감: 회차(readingRecordId) 기준. 회차 정보가 없으면 버튼을 그리지 않는다.
  const readingRecordId = params.readingRecordId;
  const writeReview = () => {
    if (readingRecordId !== null) router.push(toReviewWrite(readingRecordId));
  };
  const openReview = () => {
    if (readingRecordId !== null) router.push(toReviewDetail(readingRecordId));
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <CompleteBanner />
      <StreakLevelCard streak={data.streak} level={data.level} />
      <ReadingResultCard record={data.record} />
      <QuestProgressCard quests={data.quests} />
      <RewardCoinCard coin={data.rewardCoin} />
      {readingRecordId !== null ? (
        <WriteReviewButton review={data.review} round={params.round} onWrite={writeReview} onOpen={openReview} />
      ) : null}
      <CompleteActions onHome={goHome} onContinue={continueReading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COMPLETE_COLORS.background },
  content: { width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 16, gap: 14 },
});
