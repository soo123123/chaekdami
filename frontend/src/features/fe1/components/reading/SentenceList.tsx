import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, HIT_SLOP, keepAllWords, radius, serifFont, spacing } from '../../constants/theme';
import type { Sentence } from '../../types/reading';
import { formatDate } from '../../utils/format';
import { Card } from '../common/Card';
import { Icon } from '../common/Icon';

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
        <Pressable accessibilityRole="button" hitSlop={HIT_SLOP} onPress={() => setIsAll(v => !v)} style={styles.moreButton}>
          <Text style={styles.more}>{isAll ? '접기' : '전체 보기'}</Text>
          <Icon name={isAll ? 'chevronUp' : 'chevronRight'} size={16} color={colors.secondaryText} />
        </Pressable>
      ) : undefined}
    >
      {sentences.length === 0 ? (
        <Text style={styles.empty}>독서를 마치고 인상 깊었던 문장을 남겨보세요.</Text>
      ) : (
        visible.map(sentence => (
          <View key={sentence.sentenceId} style={styles.item}>
            <View style={styles.body}>
              <View style={styles.quoteRow}>
                <Text style={styles.mark}>“</Text>
                <Text style={styles.quote}>{`${sentence.content}”`}</Text>
              </View>
              <Text style={styles.meta}>
                {[sentence.page ? `${sentence.page}쪽` : null, `${formatDate(sentence.createdAt)} 기록`].filter(Boolean).join('   |   ')}
              </Text>
            </View>
            <Icon name="bookmark" size={22} color={colors.text} />
          </View>
        ))
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  moreButton: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  more: { fontSize: 14, color: colors.secondaryText },
  empty: { fontSize: 14, color: colors.secondaryText },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: '#F8F1E8', borderRadius: radius.input + 2, paddingVertical: spacing.md, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border },
  body: { flex: 1, gap: spacing.sm },
  quoteRow: { flexDirection: 'row', gap: 4 },
  mark: { fontFamily: serifFont, fontSize: 22, lineHeight: 24, color: colors.secondaryText, fontWeight: '700' },
  quote: { flex: 1, fontFamily: serifFont, fontSize: 16, lineHeight: 25, color: colors.text, ...keepAllWords },
  meta: { fontSize: 12, color: colors.secondaryText, marginLeft: 16 },
});
