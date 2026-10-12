import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, HIT_SLOP, radius, spacing } from '../../constants/theme';
import type { Sentence } from '../../types/reading';
import { formatDate } from '../../utils/format';
import { Card } from '../common/Card';

const PREVIEW_COUNT = 2;

/** 인상 깊었던 문장 모음 (전체 보기 토글) */
export function SentenceList({ sentences }: { sentences: Sentence[] }) {
  const [isAll, setIsAll] = useState(false);
  const visible = isAll ? sentences : sentences.slice(0, PREVIEW_COUNT);
  const canToggle = sentences.length > PREVIEW_COUNT;
  return (
    <Card
      title="인상 깊었던 문장 모음"
      right={canToggle ? (
        <Pressable accessibilityRole="button" hitSlop={HIT_SLOP} onPress={() => setIsAll(v => !v)}>
          <Text style={styles.more}>{isAll ? '접기' : `전체 보기 (${sentences.length}) ›`}</Text>
        </Pressable>
      ) : undefined}
    >
      {sentences.length === 0 ? (
        <Text style={styles.empty}>독서를 마치고 인상 깊었던 문장을 남겨보세요.</Text>
      ) : (
        visible.map(sentence => (
          <View key={sentence.sentenceId} style={styles.item}>
            <Text style={styles.quote}>{`“ ${sentence.content} ”`}</Text>
            <Text style={styles.meta}>
              {[sentence.page ? `${sentence.page}쪽` : null, `${formatDate(sentence.createdAt)} 기록`].filter(Boolean).join('   |   ')}
            </Text>
          </View>
        ))
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  more: { fontSize: 14, color: colors.secondaryText },
  empty: { fontSize: 14, color: colors.secondaryText },
  item: { backgroundColor: colors.surfaceMuted, borderRadius: radius.input, padding: spacing.md, gap: spacing.sm, borderWidth: 1, borderColor: colors.border },
  quote: { fontSize: 15, lineHeight: 23, color: colors.text },
  meta: { fontSize: 12, color: colors.secondaryText },
});
