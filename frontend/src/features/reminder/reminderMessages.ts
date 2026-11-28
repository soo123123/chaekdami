/**
 * 독서 알림 문구 (스펙 014 알림 목록, 단계별 문구, R5.4~R5.6)
 */

/** 이 길이(공백 포함) 이하인 문구는 제목으로만 보낸다 */
export const SHORT_TEXT_MAX = 25;

export interface ReminderContent {
  title: string;
  body?: string;
}

/** 짧으면 문구를 제목으로, 길면 "책다듬이가 {닉네임}님을 찾고 있어요" 제목 + 본문 (R5.4) */
export function toContent(text: string, nickname: string): ReminderContent {
  if (text.length <= SHORT_TEXT_MAX) return { title: text };
  const name = nickname.trim() || '독자';
  return { title: `책다듬이가 ${name}님을 찾고 있어요`, body: text };
}

/** 260 → "4시간 20분", 40 → "40분", 120 → "2시간" */
export function formatMinutes(minutes: number): string {
  const safe = Math.max(0, Math.floor(minutes));
  const hours = Math.floor(safe / 60);
  const rest = safe % 60;
  if (hours === 0) return `${rest}분`;
  if (rest === 0) return `${hours}시간`;
  return `${hours}시간 ${rest}분`;
}

export const reminderText = {
  evening: () => '오늘 한 페이지만 읽어볼까요?',
  streak: (days: number) => `${days}일 연속 독서가 이어지려면 오늘 10분만 읽어요!`,
  weekendMorning: () => '여유로운 주말 아침, 책 한 장 어떠세요?',
  goalNear: (remainingMinutes: number) =>
    `이번 주 목표까지 ${formatMinutes(remainingMinutes)} 남았어요! 조금만 더 읽어볼까요?`,
  weeklyAchieved: (weekMinutes: number) =>
    `이번 주 ${formatMinutes(weekMinutes)} 읽었어요. 목표 달성! 다음 주도 함께해요!`,
  weeklyShort: (remainingMinutes: number) =>
    `이번 주 목표까지 ${formatMinutes(remainingMinutes)} 남았어요. 오늘 마무리해볼까요?`,
};

/** 7번 미접속(2·4·6일째)과 3번 복귀(8·14·30일째)의 단계별 제목·본문. 감정 제목을 그대로 쓴다 */
export const ABSENCE_STAGES: { day: number; kind: 7 | 3; title: string; body: string }[] = [
  { day: 2, kind: 7, title: '책다듬이가 시무룩해요 🥺', body: '이틀째 책장이 조용하네요… 읽던 책에 먼지 쌓일까 봐 걱정돼요.' },
  { day: 4, kind: 7, title: '책다듬이가 서운해요 😢', body: '나흘이나 책을 안 펼쳤어요? 책갈피가 아직 그 자리에 그대로예요.' },
  { day: 6, kind: 7, title: '책다듬이가 삐졌어요 😤', body: '엿새째예요. 책이 자꾸 "나 잊은 거 아니지?" 하고 물어봐요. 대답 좀 해줘요!' },
  { day: 8, kind: 3, title: '책다듬이가 화났어요 💢', body: '일주일 넘게 연락도 없다니! 읽던 쪽수까지 다 기억하고 있다고요.' },
  { day: 14, kind: 3, title: '책다듬이가 단단히 화났어요 🔥', body: '2주째… 책장에 "주인 찾습니다" 쪽지 붙여 놨어요.' },
  {
    day: 30,
    kind: 3,
    title: '책다듬이가 포기했어요 🏳️',
    body: '알겠어요, 이제 알림 안 보낼게요. 그래도 책갈피는 그대로 꽂아 둘게요. 언제든 돌아와요!',
  },
];
