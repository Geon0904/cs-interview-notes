/**
 * 콘텐츠 데이터 모델.
 *
 * Markdown(content/*.md) → scripts/build-content.ts(빌드 타임 파서) → JSON → 이 타입으로 앱에서 사용.
 * 빌드 스크립트와 앱이 같은 타입을 공유하기 때문에, 파서가 만드는 모양과
 * 화면이 기대하는 모양이 어긋나면 `tsc`가 컴파일 단계에서 잡아 줍니다.
 */

/** 문답 카드·섹션 소개에 쓰이는 블록. `t`(type) 값으로 종류를 구분하는 Discriminated Union. */
export type Block =
  | { t: 'easy'; text: string } // E: 쉽게 이해하기
  | { t: 'ans'; text: string } // A: 면접 답
  | { t: 'mem'; text: string } // M: 기억할 것
  | { t: 'p'; text: string } // P: 일반 문단
  | { t: 'ol'; items: string[] }
  | { t: 'ul'; items: string[] }
  | { t: 'code'; lang: string; text: string }
  | { t: 'table'; head: string[]; rows: string[][] };

/** 설명(Lesson)의 필드 종류. */
export const FIELD_KEYS = ['ONE', 'LIKE', 'STEP', 'WHY', 'USE', 'KEY', 'PRO', 'CON', 'END'] as const;
export type FieldKey = (typeof FIELD_KEYS)[number];

/** 모든 설명에 반드시 있어야 하는 필드. 빠지면 빌드가 실패합니다. */
export const REQUIRED_FIELDS: readonly FieldKey[] = ['ONE', 'LIKE', 'STEP', 'END'];

export interface LessonField {
  k: FieldKey;
  /** 필드 첫 줄의 본문 (없을 수 있음: STEP처럼 목록만 있는 경우) */
  text: string;
  /** 필드 아래에 붙은 목록·표·코드 */
  sub: Block[];
}

export interface Lesson {
  title: string;
  fields: LessonField[];
}

export interface Card {
  q: string;
  blocks: Block[];
}

export interface Section {
  title: string;
  intro: Block[];
  lessons: Lesson[];
  cards: Card[];
}

export interface QuizItem {
  q: string;
  /** 보기 4개 */
  opts: [string, string, string, string];
  /** 정답 보기의 인덱스 (0~3) */
  ans: 0 | 1 | 2 | 3;
  /** 해설 */
  exp: string;
}

export interface Topic {
  id: string;
  ko: string;
  en: string;
  desc: string;
  analogy: string;
  intro: string;
  one: string;
  introBlocks: Block[];
  sections: Section[];
  quiz: QuizItem[];
}

export type StageKey = 'base' | 'code' | 'svc' | 'ai';

/** 학습 단계. 화면에 보이는 단계 이름은 언어별 문구 사전(src/i18n/strings.ts)에 있어요. */
export interface Stage {
  key: StageKey;
  topics: string[];
}

/**
 * 홈 화면에 필요한 최소 정보만 담은 요약본.
 * 전체 콘텐츠(약 0.8MB)를 처음부터 내려받지 않도록, 홈은 이 작은 인덱스만 읽고
 * 주제 본문은 주제를 열 때 따로 불러옵니다(Code Splitting).
 */
export interface TopicMeta {
  id: string;
  ko: string;
  en: string;
  desc: string;
  stage: StageKey;
  hasLessons: boolean;
  quizCount: number;
  sections: { title: string; cards: number; lessons: number }[];
}

export interface ContentIndex {
  stages: Stage[];
  topics: TopicMeta[];
  /** 아직 번역되지 않아 한국어 원문을 대신 쓴 주제 (번역이 끝나면 빈 배열) */
  fallback: string[];
}

/** 랜덤 퀴즈·오답 노트용: 모든 주제의 퀴즈만 모은 묶음. */
export type QuizBank = Record<string, { name: string; items: QuizItem[] }>;
