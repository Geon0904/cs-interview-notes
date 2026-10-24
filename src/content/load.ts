/**
 * 콘텐츠를 불러오는 곳은 이 파일 하나뿐이에요.
 * 화면 컴포넌트는 데이터가 "어디서, 어떻게" 오는지 몰라도 되도록 분리했어요.
 */
import enIndexJson from '../generated/en/index.json';
import koIndexJson from '../generated/ko/index.json';
import type { Lang } from '../i18n/strings';
import type { ContentIndex, QuizBank, StageKey, Topic, TopicMeta } from './types';

/** 홈 화면용 요약은 두 언어 모두 첫 번들에 바로 포함 (각 약 12KB) */
export const INDEX: Record<Lang, ContentIndex> = {
  ko: koIndexJson as unknown as ContentIndex,
  en: enIndexJson as unknown as ContentIndex,
};

const metaMap = (idx: ContentIndex) => Object.fromEntries(idx.topics.map((t) => [t.id, t])) as Record<string, TopicMeta>;
export const TOPIC_META: Record<Lang, Record<string, TopicMeta>> = { ko: metaMap(INDEX.ko), en: metaMap(INDEX.en) };

/** 단계는 언어와 상관없이 같아요. */
export const stageKeyOf = (tid: string): StageKey => TOPIC_META.ko[tid]!.stage;

/** 화면에 보일 주제 이름: 한국어 화면은 한국어 이름, 영어 화면은 영어 이름 */
export const topicName = (t: { ko: string; en: string }, lang: Lang) => (lang === 'ko' ? t.ko : t.en);

/**
 * 주제 본문은 언어·주제마다 별도 파일(Chunk)로 나눠, 열 때 내려받아요.
 * import.meta.glob은 Vite 기능으로, 빌드할 때 파일마다 `() => import('./ko/topics/01.json')` 같은
 * 지연 로딩 함수를 만들어 줍니다. 그래서 2개 언어 × 16개 주제가 각각 독립된 파일이 돼요.
 */
const topicModules = import.meta.glob<{ default: Topic }>('../generated/*/topics/*.json');
const quizModules = import.meta.glob<{ default: QuizBank }>('../generated/*/quiz.json');

export class NotFoundError extends Error {}

export async function loadTopic(lang: Lang, id: string): Promise<Topic> {
  const load = topicModules[`../generated/${lang}/topics/${id}.json`];
  if (!load) throw new NotFoundError(`주제 ${id}를 찾을 수 없어요`);
  return (await load()).default;
}

export async function loadQuizBank(lang: Lang): Promise<QuizBank> {
  return (await quizModules[`../generated/${lang}/quiz.json`]!()).default;
}

/** URL의 ?stage= 값 검증 */
export const STAGE_KEYS: ('all' | StageKey)[] = ['all', 'base', 'code', 'svc', 'ai'];
export function parseStage(v: string | null): 'all' | StageKey {
  return STAGE_KEYS.includes(v as StageKey) ? (v as StageKey) : 'all';
}
