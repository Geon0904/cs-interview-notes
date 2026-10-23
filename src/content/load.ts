/**
 * 콘텐츠를 불러오는 곳은 이 파일 하나뿐이에요.
 * 화면 컴포넌트는 데이터가 "어디서, 어떻게" 오는지 몰라도 되도록 분리했어요.
 */
import indexJson from '../generated/index.json';
import type { ContentIndex, QuizBank, Stage, StageKey, Topic, TopicMeta } from './types';

/** 홈 화면용 요약은 첫 번들에 바로 포함 (약 12KB) */
export const INDEX = indexJson as unknown as ContentIndex;

export const TOPIC_META: Record<string, TopicMeta> = Object.fromEntries(INDEX.topics.map((t) => [t.id, t]));
export const STAGE_BY_KEY: Record<StageKey, Stage> = Object.fromEntries(INDEX.stages.map((s) => [s.key, s])) as Record<StageKey, Stage>;
export const stageOf = (tid: string): Stage => STAGE_BY_KEY[TOPIC_META[tid]!.stage];

/**
 * 주제 본문은 주제마다 별도 파일(Chunk)로 나눠, 열 때 내려받아요.
 * import.meta.glob은 Vite 기능으로, 빌드할 때 파일마다 `() => import('./01.json')` 같은
 * 지연 로딩 함수를 만들어 줍니다. 그래서 16개 주제가 각각 독립된 파일이 돼요.
 */
const topicModules = import.meta.glob<{ default: Topic }>('../generated/topics/*.json');

export class NotFoundError extends Error {}

export async function loadTopic(id: string): Promise<Topic> {
  const load = topicModules[`../generated/topics/${id}.json`];
  if (!load) throw new NotFoundError(`주제 ${id}를 찾을 수 없어요`);
  return (await load()).default;
}

export async function loadQuizBank(): Promise<QuizBank> {
  return (await import('../generated/quiz.json')).default as unknown as QuizBank;
}

/** URL의 ?stage= 값 검증 */
export const STAGE_FILTERS: { key: 'all' | StageKey; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'base', label: '기초' },
  { key: 'code', label: '코드' },
  { key: 'svc', label: '서비스' },
  { key: 'ai', label: 'AI' },
];
export function parseStage(v: string | null): 'all' | StageKey {
  return STAGE_FILTERS.some((f) => f.key === v) ? (v as StageKey) : 'all';
}
