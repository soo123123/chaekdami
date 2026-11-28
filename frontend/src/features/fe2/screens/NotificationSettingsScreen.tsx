import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { showToast } from '@/components/Toast';
import { HIT_SLOP } from '@/constants/layout';
import { ROUTES } from '@/constants/routes';
import { getReminderStatus, saveReminderSettings } from '@/features/reminder/reminderApi';
import { formatMinutes } from '@/features/reminder/reminderMessages';
import {
  hasReminderPermission,
  requestReminderPermissionIfNeeded,
  rescheduleReminders,
} from '@/features/reminder/reminderScheduler';
import type { ReminderSettings } from '@/features/reminder/types';
import { goBackOr } from '@/utils/navigation';

/**
 * 독서 알림 설정 (스펙 014 R4.5~R4.8, R8.5).
 * 기본 화면이다. 디자인은 FE2가 다듬는다.
 */

const GREEN = '#405F4B';
const MIN_GOAL = 30;
const MAX_GOAL = 3000;
const GOAL_STEP = 30;
const GOAL_PRESETS = [120, 180, 300, 420, 600];

export default function NotificationSettingsScreen() {
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [permitted, setPermitted] = useState(true);

  const load = useCallback(async () => {
    try {
      const status = await getReminderStatus();
      setSettings(status.settings);
      setLoadFailed(false);
    } catch (error) {
      console.warn('[NotificationSettings] 설정 조회 실패:', error);
      setLoadFailed(true);
    }
    setPermitted(Platform.OS === 'web' ? true : await hasReminderPermission());
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      if (active) await load();
    })();
    return () => {
      active = false;
    };
  }, [load]);

  const save = async (next: ReminderSettings) => {
    const previous = settings;
    setSettings(next);
    setSaving(true);
    try {
      const saved = await saveReminderSettings(next);
      setSettings(saved);
      await rescheduleReminders();
    } catch (error) {
      console.warn('[NotificationSettings] 설정 저장 실패:', error);
      setSettings(previous);
      showToast('알림 설정을 저장하지 못했어요.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEnabled = async (enabled: boolean) => {
    if (!settings) return;
    if (enabled) await requestReminderPermissionIfNeeded();
    setPermitted(await hasReminderPermission());
    void save({ ...settings, enabled });
  };

  const changeGoal = (minutes: number) => {
    if (!settings) return;
    const goal = Math.min(MAX_GOAL, Math.max(MIN_GOAL, minutes));
    if (goal !== settings.weeklyGoalMinutes) void save({ ...settings, weeklyGoalMinutes: goal });
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => goBackOr(ROUTES.fe2.mypage)}
          hitSlop={HIT_SLOP}
          accessibilityLabel="뒤로 가기"
        >
          <Ionicons name="chevron-back" size={26} color="#222" />
        </Pressable>
        <Text style={styles.headerTitle}>알림 설정</Text>
        <View style={styles.headerSide}>{saving && <ActivityIndicator size="small" color={GREEN} />}</View>
      </View>

      {!settings ? (
        <View style={styles.center}>
          {loadFailed ? (
            <>
              <Text style={styles.muted}>알림 설정을 불러오지 못했어요.</Text>
              <Pressable style={styles.retry} onPress={() => void load()}>
                <Text style={styles.retryText}>다시 불러오기</Text>
              </Pressable>
            </>
          ) : (
            <ActivityIndicator color={GREEN} />
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {!permitted && settings.enabled && Platform.OS !== 'web' && (
            <Pressable style={styles.notice} onPress={() => void Linking.openSettings()}>
              <Text style={styles.noticeText}>
                휴대폰 설정에서 책다듬이 알림이 꺼져 있어요. 눌러서 알림을 허용하면 독서 알림을 받을 수 있어요.
              </Text>
            </Pressable>
          )}

          <View style={styles.card}>
            <Row
              title="독서 알림 받기"
              description="책 읽기를 잊지 않도록 알려 드려요"
              value={settings.enabled}
              onChange={enabled => void handleEnabled(enabled)}
            />
            <View style={styles.divider} />
            <Row
              title="이른 아침·늦은 저녁 알림 끄기"
              description="주말 오전 9시, 밤 9시 30분 알림을 보내지 않아요"
              value={settings.earlyLateMuted}
              disabled={!settings.enabled}
              onChange={earlyLateMuted => void save({ ...settings, earlyLateMuted })}
            />
          </View>

          <View style={[styles.card, !settings.enabled && styles.dim]}>
            <Text style={styles.title}>주간 독서 목표</Text>
            <Text style={styles.description}>목표가 가까워지면 알려 드려요</Text>
            <View style={styles.goalRow}>
              <Pressable
                style={styles.stepButton}
                disabled={!settings.enabled}
                onPress={() => changeGoal(settings.weeklyGoalMinutes - GOAL_STEP)}
                accessibilityLabel="목표 30분 줄이기"
              >
                <Ionicons name="remove" size={20} color={GREEN} />
              </Pressable>
              <Text style={styles.goalValue}>{formatMinutes(settings.weeklyGoalMinutes)}</Text>
              <Pressable
                style={styles.stepButton}
                disabled={!settings.enabled}
                onPress={() => changeGoal(settings.weeklyGoalMinutes + GOAL_STEP)}
                accessibilityLabel="목표 30분 늘리기"
              >
                <Ionicons name="add" size={20} color={GREEN} />
              </Pressable>
            </View>
            <View style={styles.presets}>
              {GOAL_PRESETS.map(minutes => (
                <Pressable
                  key={minutes}
                  disabled={!settings.enabled}
                  style={[styles.preset, settings.weeklyGoalMinutes === minutes && styles.presetActive]}
                  onPress={() => changeGoal(minutes)}
                >
                  <Text
                    style={[styles.presetText, settings.weeklyGoalMinutes === minutes && styles.presetTextActive]}
                  >
                    {formatMinutes(minutes)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Text style={styles.footnote}>밤 10시 30분부터 아침 8시까지는 알림을 보내지 않아요.</Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Row(props: {
  title: string;
  description: string;
  value: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={[styles.row, props.disabled && styles.dim]}>
      <View style={styles.rowText}>
        <Text style={styles.title}>{props.title}</Text>
        <Text style={styles.description}>{props.description}</Text>
      </View>
      <Switch
        value={props.value}
        disabled={props.disabled}
        onValueChange={props.onChange}
        trackColor={{ true: GREEN }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F5F0' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#222' },
  headerSide: { width: 26, alignItems: 'flex-end' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  muted: { color: '#777' },
  retry: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: GREEN },
  retryText: { color: '#fff', fontWeight: '600' },
  content: { padding: 16, gap: 16 },
  notice: { padding: 14, borderRadius: 12, backgroundColor: '#FFF4E5' },
  noticeText: { color: '#8A5A00', lineHeight: 20 },
  card: { padding: 16, borderRadius: 16, backgroundColor: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { flex: 1 },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 14 },
  title: { fontSize: 16, fontWeight: '600', color: '#222' },
  description: { marginTop: 4, fontSize: 13, color: '#777' },
  dim: { opacity: 0.45 },
  goalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, marginTop: 16 },
  stepButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalValue: { minWidth: 110, textAlign: 'center', fontSize: 20, fontWeight: '700', color: GREEN },
  presets: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 16 },
  preset: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#DDD' },
  presetActive: { borderColor: GREEN, backgroundColor: GREEN },
  presetText: { fontSize: 13, color: '#555' },
  presetTextActive: { color: '#fff' },
  footnote: { fontSize: 12, color: '#999', textAlign: 'center' },
});
