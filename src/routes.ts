/**
 * 주소(URL) 설계를 한곳에 모아 두었어요. 화면 어디서든 문자열을 직접 조립하지 않고 이 함수를 써서
 * 주소 규칙을 바꿀 때 한 군데만 고치면 되게 했습니다.
 *
 *   /                          홈 (?stage=ai 처럼 단계 필터)
 *   /topic/07/learn?s=3        07번 주제 · 설명 탭 · 3번째 섹션
 *   /random?stage=base         랜덤 퀴즈
 *   /review                    오답 노트
 */
export const TOPIC_TABS = [
  { key: 'learn', label: '설명' },
  { key: 'concept', label: '개념 정리' },
  { key: 'qa', label: '문답' },
  { key: 'quiz', label: '퀴즈' },
] as const;

export type TopicTab = (typeof TOPIC_TABS)[number]['key'];

export function isTopicTab(v: string | undefined): v is TopicTab {
  return TOPIC_TABS.some((t) => t.key === v);
}

/** sec는 0부터, 주소의 s는 사람이 읽기 쉽게 1부터 */
export function topicPath(id: string, tab: TopicTab, sec = 0): string {
  return `/topic/${id}/${tab}${sec > 0 ? `?s=${sec + 1}` : ''}`;
}

export function parseSection(v: string | null, count: number): number {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= count ? n - 1 : 0;
}
