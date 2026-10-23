/**
 * 학습 진도 상태와 Reducer.
 *
 * - 저장하지 않아요: 연습용 앱이라 새로고침하면 처음부터 시작하도록 일부러 메모리에만 둡니다.
 *   (나중에 저장이 필요해지면 Provider에서 localStorage와 동기화하는 코드만 추가하면 돼요.)
 * - Reducer는 순수 함수: (이전 상태, 액션) → 새 상태. 화면 없이 단위 테스트할 수 있어요.
 * - 불변성: 객체를 직접 고치지 않고 새 객체를 만들어 반환해요. React가 "바뀌었다"는 걸
 *   참조 비교(===)로 빠르게 알아채려면 꼭 필요합니다.
 */
export type CardMark = 'ok' | 'again';
export type StudyTab = 'learn' | 'qa';

export interface QuizScore {
  best: number;
  last: number;
  n: number;
}

export interface Progress {
  /** "주제:섹션:카드" → 이해함/다시 볼래요 */
  cards: Record<string, CardMark>;
  /** 주제별 확인 퀴즈 점수 */
  quiz: Record<string, QuizScore>;
  /** 틀린 퀴즈 "주제:문항" (오답 노트) */
  wrong: Record<string, true>;
  /** 읽은 설명 섹션 "주제:섹션" */
  read: Record<string, true>;
  /** 마지막으로 공부한 위치 (홈의 '이어서 학습') */
  last: { tid: string; sec: number; tab: StudyTab | null } | null;
}

export const initialProgress: Progress = { cards: {}, quiz: {}, wrong: {}, read: {}, last: null };

export type ProgressAction =
  | { type: 'card/mark'; key: string; mark: CardMark }
  | { type: 'card/toggleAgain'; key: string }
  | { type: 'lesson/read'; tid: string; sec: number }
  | { type: 'visit'; tid: string; sec: number; tab: StudyTab | null }
  | { type: 'quiz/answer'; tid: string; qi: number; correct: boolean; review: boolean }
  | { type: 'quiz/finish'; tid: string; score: number; n: number }
  | { type: 'wrong/remove'; key: string };

export const cardKey = (tid: string, sec: number, card: number) => `${tid}:${sec}:${card}`;
export const quizKey = (tid: string, qi: number) => `${tid}:${qi}`;

/** 객체에서 키 하나를 뺀 새 객체 (원본은 그대로) */
function without<T>(obj: Record<string, T>, key: string): Record<string, T> {
  if (!(key in obj)) return obj;
  const next = { ...obj };
  delete next[key];
  return next;
}

export function progressReducer(state: Progress, action: ProgressAction): Progress {
  switch (action.type) {
    case 'card/mark':
      return { ...state, cards: { ...state.cards, [action.key]: action.mark } };

    case 'card/toggleAgain':
      return state.cards[action.key] === 'again'
        ? { ...state, cards: without(state.cards, action.key) }
        : { ...state, cards: { ...state.cards, [action.key]: 'again' } };

    case 'lesson/read':
      return { ...state, read: { ...state.read, [`${action.tid}:${action.sec}`]: true } };

    case 'visit': {
      const l = state.last;
      if (l && l.tid === action.tid && l.sec === action.sec && l.tab === action.tab) return state; // 같으면 그대로 (불필요한 리렌더 방지)
      return { ...state, last: { tid: action.tid, sec: action.sec, tab: action.tab } };
    }

    case 'quiz/answer': {
      const key = quizKey(action.tid, action.qi);
      if (!action.correct) return { ...state, wrong: { ...state.wrong, [key]: true } };
      // 오답 노트에서 다시 맞히면 지워요. 일반 퀴즈에서 맞힌 건 오답 노트를 건드리지 않아요.
      return action.review ? { ...state, wrong: without(state.wrong, key) } : state;
    }

    case 'quiz/finish': {
      const prev = state.quiz[action.tid];
      return {
        ...state,
        quiz: {
          ...state.quiz,
          [action.tid]: { best: Math.max(action.score, prev?.best ?? 0), last: action.score, n: action.n },
        },
      };
    }

    case 'wrong/remove':
      return { ...state, wrong: without(state.wrong, action.key) };
  }
}

/* ---------- 계산(Selector) 함수: 상태에서 화면에 필요한 숫자를 뽑아요 ---------- */

/** 섹션에서 '이해했어요'를 누른 카드 수 */
export function sectionDone(p: Progress, tid: string, sec: number, cardCount: number): number {
  let ok = 0;
  for (let c = 0; c < cardCount; c++) if (p.cards[cardKey(tid, sec, c)] === 'ok') ok++;
  return ok;
}

/** 아직 이해하지 못한 첫 카드 (모두 이해했으면 -1) */
export function firstOpenCard(p: Progress, tid: string, sec: number, cardCount: number): number {
  for (let c = 0; c < cardCount; c++) if (p.cards[cardKey(tid, sec, c)] !== 'ok') return c;
  return -1;
}

/** from 다음부터 한 바퀴 돌며 아직 이해하지 못한 카드를 찾아요. */
export function nextOpenCard(p: Progress, tid: string, sec: number, cardCount: number, from: number): number {
  for (let j = 1; j <= cardCount; j++) {
    const c = (from + j) % cardCount;
    if (p.cards[cardKey(tid, sec, c)] !== 'ok') return c;
  }
  return -1;
}
