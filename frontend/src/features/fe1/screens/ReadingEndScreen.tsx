import { StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { colors, spacing } from '../constants/theme';
export function ReadingEndScreen() { return <ScreenContainer><View style={styles.container}><Text style={styles.title}>독서 기록</Text><Text style={styles.description}>독서 시간과 시작·종료 페이지를 기록할 화면입니다.</Text><Text style={styles.note}>기본 골조 — API 연동은 백엔드 계약 확정 후 진행합니다.</Text></View></ScreenContainer>; }
const styles = StyleSheet.create({ container: { gap: spacing.md }, title: { color: colors.text, fontSize: 24, fontWeight: '700' }, description: { color: colors.secondaryText, fontSize: 15, lineHeight: 22 }, note: { color: colors.secondaryText, fontSize: 13 } });
