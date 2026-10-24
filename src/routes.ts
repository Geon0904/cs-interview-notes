/**
 * 주소(URL) 설계를 한곳에 모아 두었어요. 화면 어디서든 문자열을 직접 조립하지 않고 이 함수를 써서
 * 주소 규칙을 바꿀 때 한 군데만 고치면 되게 했습니다.
 *
 *   /                          홈 (?stage=ai 처럼 단계 필터)
 *   /topic/07/learn?s=3        07번 주제 · 설명 탭 · 3번째 섹션
 *   /random?stage=base         랜덤 퀴즈
 *   /review                    오답 노트
 *   /en/...                    위 모든 주소의 영어판 (base = '/en')
 */
export const TOPIC_TABS = ['learn', 'concept', 'qa', 'quiz'] as const;

export type TopicTab = (typeof TOPIC_TABS)[number];

export function isTopicTab(v: string | undefined): v is TopicTab {
  return TOPIC_TABS.some((t) => t === v);
}

/** base는 언어별 주소 앞부분('' 또는 '/en'). sec는 0부터, 주소의 s는 사람이 읽기 쉽게 1부터 */
export function topicPath(base: string, id: string, tab: TopicTab, sec = 0): string {
  return `${base}/topic/${id}/${tab}${sec > 0 ? `?s=${sec + 1}` : ''}`;
}

export function parseSection(v: string | null, count: number): number {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= count ? n - 1 : 0;
}
