import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, HIT_SLOP, spacing } from '../../constants/theme';
import { Icon } from '../common/Icon';

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
          <Text style={styles.moreLabel}>{isExpanded ? '접기' : '더보기'}</Text>
          <Icon name={isExpanded ? 'chevronUp' : 'chevronDown'} size={16} color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  text: { fontSize: 15, lineHeight: 25, color: '#4E4A46' },
  more: { alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 4 },
  moreLabel: { fontSize: 14, color: colors.primary, fontWeight: '600' },
});
