import AsyncStorage from '@react-native-async-storage/async-storage';
import { MAX_READING_SECONDS } from '../constants/config';
import { getCurrentUserKey } from './currentUser';

/**
 * 저장하지 못한 독서 기록을 기기에 보관한다 (ISSUE-LIMIT-2, ASK-17).
 * 앱이 종료되거나 로그인이 끊겨 독서 화면을 벗어나도, 다시 열면 이어서 하거나 저장할 수 있게 한다.
 *
 * - 한 번에 하나만 보관한다 (마지막으로 읽던 책). 계정별로 나눠 저장해 다른 계정에는 보이지 않는다.
 * - timer: 독서 시작 화면에서 재던 시간. 앱이 꺼져 있던 시간은 세지 않도록, 마지막으로 확인한 시각(lastSeenAt)까지만 인정한다.
 * - end: 독서 종료 화면에서 입력하던 값 (시간·쪽·문장). 사진 인증은 다시 해야 한다.
 */
export type ReadingDraft =
  | {
      kind: 'timer';
      bookId: number;
      bookTitle: string;
      accumulatedMs: number;
      runningSince: number | null;
      lastSeenAt: number;
    }
  | {
      kind: 'end';
      bookId: number;
      bookTitle: string;
      /** 타이머로 잰 시간(초). 종료 화면의 수정 상한 */
      elapsedTime: number;
      readingTime: number;
      startPage: number;
      endPage: number;
      sentence: string;
      savedAt: number;
    };

/** 이보다 오래된 기록은 버린다 (일주일) */
const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const draftKey = (userKey: string) => `@chaekdami_reading_draft:${userKey}`;

export async function saveReadingDraft(draft: ReadingDraft): Promise<void> {
  try {
    await AsyncStorage.setItem(draftKey(await getCurrentUserKey()), JSON.stringify(draft));
  } catch {
    // 보관은 보조 기능이라 실패해도 독서는 계속한다
  }
}

export async function loadReadingDraft(): Promise<ReadingDraft | null> {
  try {
    const raw = await AsyncStorage.getItem(draftKey(await getCurrentUserKey()));
    if (!raw) return null;
    const draft = JSON.parse(raw) as ReadingDraft;
    const savedAt = draft.kind === 'timer' ? draft.lastSeenAt : draft.savedAt;
    if (!(draft.bookId > 0) || Date.now() - savedAt > DRAFT_MAX_AGE_MS) return null;
    if (draft.kind === 'timer' && draftSeconds(draft) <= 0) return null;
    return draft;
  } catch {
    return null;
  }
}

/** bookId를 주면 그 책의 기록일 때만 지운다 */
export async function clearReadingDraft(bookId?: number): Promise<void> {
  try {
    const key = draftKey(await getCurrentUserKey());
    if (bookId !== undefined) {
      const raw = await AsyncStorage.getItem(key);
      if (raw && (JSON.parse(raw) as ReadingDraft).bookId !== bookId) return;
    }
    await AsyncStorage.removeItem(key);
  } catch {
    // 무시
  }
}

/** 보관된 기록의 독서 시간(초). 2시간 상한을 넘지 않는다 */
export function draftSeconds(draft: ReadingDraft): number {
  if (draft.kind === 'end') return draft.readingTime;
  const runningMs = draft.runningSince !== null ? Math.max(0, draft.lastSeenAt - draft.runningSince) : 0;
  return Math.min(Math.floor((draft.accumulatedMs + runningMs) / 1000), MAX_READING_SECONDS);
}
