/**
 * 파싱된 주제들로 홈 인덱스와 퀴즈 묶음을 만드는 순수 함수들.
 */
import type { ContentIndex, QuizBank, Stage, StageKey, Topic } from '../../src/content/types';
import { ContentError } from './parser';

/** 학습 단계와 각 단계에 속하는 주제 번호. 주제 순서가 곧 추천 학습 순서예요. */
export const STAGES: Stage[] = [
  { no: '1단계', name: '컴퓨터의 기초', key: 'base', topics: ['01', '02', '03', '04'] },
  { no: '2단계', name: '코드와 문제 해결', key: 'code', topics: ['05', '06', '07', '08'] },
  { no: '3단계', name: '서비스 만들기', key: 'svc', topics: ['09', '10', '11'] },
  { no: '4단계', name: '인공지능', key: 'ai', topics: ['12', '13', '14', '15', '16'] },
];

export function buildIndex(topics: Topic[], stages: Stage[]): ContentIndex {
  const ids = new Set<string>();
  for (const t of topics) {
    if (ids.has(t.id)) throw new ContentError(`content/${t.id}.md`, null, `주제 id가 중복돼요: ${t.id}`);
    ids.add(t.id);
  }

  const stageOf = new Map<string, StageKey>();
  for (const s of stages) {
    for (const id of s.topics) {
      if (!ids.has(id)) throw new ContentError('STAGES', null, `${s.no}에 없는 주제 ${id}가 있어요`);
      if (stageOf.has(id)) throw new ContentError('STAGES', null, `주제 ${id}가 두 단계에 들어 있어요`);
      stageOf.set(id, s.key);
    }
  }
  for (const t of topics) {
    if (!stageOf.has(t.id)) throw new ContentError(`content/${t.id}.md`, null, `주제 ${t.id}가 어느 단계에도 없어요`);
  }

  return {
    stages,
    topics: topics.map((t) => ({
      id: t.id,
      ko: t.ko,
      en: t.en,
      desc: t.desc,
      stage: stageOf.get(t.id)!,
      hasLessons: t.sections.some((s) => s.lessons.length > 0),
      quizCount: t.quiz.length,
      sections: t.sections.map((s) => ({ title: s.title, cards: s.cards.length, lessons: s.lessons.length })),
    })),
  };
}

export function buildQuizBank(topics: Topic[]): QuizBank {
  return Object.fromEntries(topics.map((t) => [t.id, { ko: t.ko, items: t.quiz }]));
}
