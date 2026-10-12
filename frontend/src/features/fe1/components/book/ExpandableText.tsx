import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, HIT_SLOP, spacing } from '../../constants/theme';

const COLLAPSED_LINES = 4;

/** 책 소개 '더보기' */
export function ExpandableText({ text }: { text: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  return (
    <View style={styles.container}>
      <Text
        style={styles.text}
        numberOfLines={isExpanded ? undefined : COLLAPSED_LINES}
        onTextLayout={event => {
          if (!isExpanded && event.nativeEvent.lines.length >= COLLAPSED_LINES) setCanExpand(true);
        }}
      >
        {text}
      </Text>
      {canExpand || isExpanded ? (
        <Pressable accessibilityRole="button" hitSlop={HIT_SLOP} onPress={() => setIsExpanded(v => !v)} style={styles.more}>
          <Text style={styles.moreLabel}>{isExpanded ? '접기 ⌃' : '더보기 ⌄'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  text: { fontSize: 15, lineHeight: 24, color: colors.secondaryText },
  more: { alignSelf: 'flex-end' },
  moreLabel: { fontSize: 14, color: colors.primary, fontWeight: '600' },
});
