import { StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { colors, spacing } from '../constants/theme';
import { ReadingProgress } from '../components/reading/ReadingProgress';
export function BookRegisterScreen() { return <ScreenContainer><View style={styles.container}><Text style={styles.title}>책 등록</Text><Text style={styles.description}>선택한 도서를 서재에 등록할 화면입니다.</Text><ReadingProgress currentPage={0} totalPages={400} /><Text style={styles.note}>기본 골조 — API 연동은 백엔드 계약 확정 후 진행합니다.</Text></View></ScreenContainer>; }
const styles = StyleSheet.create({ container: { gap: spacing.md }, title: { color: colors.text, fontSize: 24, fontWeight: '700' }, description: { color: colors.secondaryText, fontSize: 15, lineHeight: 22 }, note: { color: colors.secondaryText, fontSize: 13 } });
