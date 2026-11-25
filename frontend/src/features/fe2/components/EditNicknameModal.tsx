import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { isAxiosError } from 'axios';

import { showToast } from '@/components/Toast';
import { updateNickname } from '../api/userApi';

const MAX_LENGTH = 16;

// 서버 NicknameRules와 같은 규칙
function violationMessage(nickname: string): string | null {
  if (nickname.length < 2 || nickname.length > MAX_LENGTH) {
    return '닉네임은 2자 이상 16자 이하로 입력해 주세요.';
  }

  if (!/^[A-Za-z0-9가-힣ㄱ-ㅎㅏ-ㅣ]+$/.test(nickname)) {
    return '닉네임은 한글, 영문, 숫자만 사용할 수 있어요.';
  }

  return null;
}

function failureMessage(error: unknown): string {
  const data = isAxiosError(error) ? error.response?.data : undefined;

  if (data?.code === 'NICKNAME_ALREADY_EXISTS') {
    return '이미 사용 중인 닉네임이에요.';
  }

  // 형식 위반·비밀번호와 같음
  const fieldMessage = Array.isArray(data?.fields)
    ? data.fields.find(
        (item: { field?: string }) => item?.field === 'nickname'
      )?.message
    : undefined;

  return typeof fieldMessage === 'string'
    ? fieldMessage
    : '닉네임을 변경하지 못했어요. 잠시 후 다시 시도해 주세요.';
}

interface Props {
  nickname: string;
  onClose: () => void;
  onSaved: (nickname: string) => void;
}

// 열 때마다 새로 그린다 (이전 입력과 오류가 남지 않게)
export default function EditNicknameModal({
  nickname,
  onClose,
  onSaved,
}: Props) {
  const [value, setValue] = useState(nickname);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const close = () => {
    if (!savingRef.current) onClose();
  };

  const save = async () => {
    if (savingRef.current) return;

    const next = value.trim();
    const violation = violationMessage(next);

    if (violation) {
      setError(violation);
      return;
    }

    if (next === nickname) {
      onClose();
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setError(null);

    try {
      const updated = await updateNickname(next);

      onSaved(updated.nickname ?? next);
      showToast('닉네임을 변경했어요.');
    } catch (e) {
      savingRef.current = false;
      setSaving(false);
      setError(failureMessage(e));
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.title}>닉네임 변경</Text>

          <TextInput
            style={styles.input}
            value={value}
            onChangeText={(text) => {
              setValue(text);
              setError(null);
            }}
            editable={!saving}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="새 닉네임"
            placeholderTextColor="#AAA39A"
            accessibilityLabel="새 닉네임"
            returnKeyType="done"
            onSubmitEditing={save}
          />

          <Text style={error ? styles.error : styles.hint}>
            {error ?? '2~16자, 한글·영문·숫자만 쓸 수 있어요.'}
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.cancelButton,
                saving && styles.disabled,
              ]}
              onPress={close}
              disabled={saving}
              accessibilityRole="button"
            >
              <Text style={styles.cancelText}>취소</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.saveButton,
                saving && styles.disabled,
              ]}
              onPress={save}
              disabled={saving}
              accessibilityRole="button"
            >
              <Text style={styles.saveText}>
                {saving ? '저장 중' : '저장'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },

  card: {
    width: '100%',
    maxWidth: 400,
    padding: 22,
    borderRadius: 20,
    backgroundColor: '#FFFDF9',
  },

  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#274B3B',
  },

  input: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E3DCD0',
    borderRadius: 12,
    fontSize: 15,
    color: '#29231F',
    backgroundColor: '#FFFFFF',
  },

  hint: {
    marginTop: 8,
    fontSize: 12,
    color: '#77736C',
  },

  error: {
    marginTop: 8,
    fontSize: 12,
    color: '#C8573E',
  },

  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },

  button: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: 12,
  },

  cancelButton: {
    backgroundColor: '#EFEAE0',
  },

  saveButton: {
    backgroundColor: '#365F49',
  },

  disabled: {
    opacity: 0.5,
  },

  cancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#77736C',
  },

  saveText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
