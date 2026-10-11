import { StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { colors, spacing } from '../constants/theme';
export function LibraryCustomizeScreen() { return <ScreenContainer><View style={styles.container}><Text style={styles.title}>서재 꾸미기</Text><Text style={styles.description}>서재 테마와 꾸미기 옵션을 표시할 화면입니다.</Text><Text style={styles.note}>기본 골조 — API 연동은 백엔드 계약 확정 후 진행합니다.</Text></View></ScreenContainer>; }
const styles = StyleSheet.create({ container: { gap: spacing.md }, title: { color: colors.text, fontSize: 24, fontWeight: '700' }, description: { color: colors.secondaryText, fontSize: 15, lineHeight: 22 }, note: { color: colors.secondaryText, fontSize: 13 } });
