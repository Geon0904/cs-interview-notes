/**
 * 파싱된 주제들로 홈 인덱스와 퀴즈 묶음을 만들고, 두 언어의 구조가 같은지 검사하는 순수 함수들.
 */
import type { Block, ContentIndex, QuizBank, Stage, StageKey, Topic } from '../../src/content/types';
import { ContentError } from './parser';

/** 학습 단계와 각 단계에 속하는 주제 번호. 주제 순서가 곧 추천 학습 순서예요. */
export const STAGES: Stage[] = [
  { key: 'base', topics: ['01', '02', '03', '04'] },
  { key: 'code', topics: ['05', '06', '07', '08'] },
  { key: 'svc', topics: ['09', '10', '11'] },
  { key: 'ai', topics: ['12', '13', '14', '15', '16'] },
];

export function buildIndex(topics: Topic[], stages: Stage[], fallback: string[] = []): ContentIndex {
  const ids = new Set<string>();
  for (const t of topics) {
    if (ids.has(t.id)) throw new ContentError(`content/${t.id}.md`, null, `주제 id가 중복돼요: ${t.id}`);
    ids.add(t.id);
  }

  const stageOf = new Map<string, StageKey>();
  for (const s of stages) {
    for (const id of s.topics) {
      if (!ids.has(id)) throw new ContentError('STAGES', null, `${s.key} 단계에 없는 주제 ${id}가 있어요`);
      if (stageOf.has(id)) throw new ContentError('STAGES', null, `주제 ${id}가 두 단계에 들어 있어요`);
      stageOf.set(id, s.key);
    }
  }
  for (const t of topics) {
    if (!stageOf.has(t.id)) throw new ContentError(`content/${t.id}.md`, null, `주제 ${t.id}가 어느 단계에도 없어요`);
  }

  return {
    stages,
    fallback,
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

export function buildQuizBank(topics: Topic[], lang: 'ko' | 'en'): QuizBank {
  return Object.fromEntries(topics.map((t) => [t.id, { name: lang === 'ko' ? t.ko : t.en, items: t.quiz }]));
}

/** 블록의 "모양"만 남긴 문자열. 글자는 달라도(번역) 모양은 같아야 해요. */
function shape(b: Block): string {
  if (b.t === 'table') return `table ${b.rows.length + 1}x${b.head.length}`;
  if (b.t === 'ol' || b.t === 'ul') return `${b.t} ${b.items.length}`;
  return b.t;
}

/**
 * 번역본이 원본과 같은 구조인지 검사해요 (Parity Check).
 *
 * 왜 필요한가요? 진도는 "주제:섹션:카드 번호"로 기억하고, 퀴즈 오답은 "주제:문항 번호"로 기억해요.
 * 그래서 두 언어의 번호가 정확히 같아야 한국어로 공부하다 영어로 바꿔도 진도가 그대로 이어져요.
 * 또 번역하다 문항을 빠뜨리거나 정답 위치가 바뀌는 실수도 이 검사가 빌드 단계에서 잡아요.
 */
export function checkParity(ko: Topic, en: Topic, file: string): void {
  const fail = (where: string, msg: string): never => {
    throw new ContentError(file, null, `한국어판과 구조가 달라요 (${where}): ${msg}`);
  };
  if (ko.id !== en.id) fail('@id', `${ko.id} vs ${en.id}`);
  if (ko.ko !== en.ko || ko.en !== en.en) fail('@ko/@en', '주제 이름은 두 파일에서 같아야 해요');
  const sameShapes = (a: Block[], b: Block[], where: string) => {
    const sa = a.map(shape).join(', ');
    const sb = b.map(shape).join(', ');
    if (sa !== sb) fail(where, `[${sa}] vs [${sb}]`);
  };
  sameShapes(ko.introBlocks, en.introBlocks, '머리말');
  if (ko.sections.length !== en.sections.length) fail('섹션 수', `${ko.sections.length} vs ${en.sections.length}`);
  ko.sections.forEach((ks, si) => {
    const es = en.sections[si]!;
    const at = `섹션 ${si + 1} "${ks.title}"`;
    sameShapes(ks.intro, es.intro, `${at} 소개`);
    if (ks.lessons.length !== es.lessons.length) fail(at, `설명 수 ${ks.lessons.length} vs ${es.lessons.length}`);
    ks.lessons.forEach((kl, li) => {
      const el = es.lessons[li]!;
      const lat = `${at} 설명 ${li + 1} "${kl.title}"`;
      const kf = kl.fields.map((f) => f.k).join(' ');
      const ef = el.fields.map((f) => f.k).join(' ');
      if (kf !== ef) fail(lat, `필드 [${kf}] vs [${ef}]`);
      kl.fields.forEach((f, fi) => sameShapes(f.sub, el.fields[fi]!.sub, `${lat} ${f.k}`));
    });
    if (ks.cards.length !== es.cards.length) fail(at, `문답 수 ${ks.cards.length} vs ${es.cards.length}`);
    ks.cards.forEach((kc, ci) => sameShapes(kc.blocks, es.cards[ci]!.blocks, `${at} 문답 ${ci + 1} "${kc.q}"`));
  });
  if (ko.quiz.length !== en.quiz.length) fail('퀴즈 수', `${ko.quiz.length} vs ${en.quiz.length}`);
  ko.quiz.forEach((kq, qi) => {
    if (kq.ans !== en.quiz[qi]!.ans) fail(`퀴즈 ${qi + 1}`, `정답 ${'ABCD'[kq.ans]} vs ${'ABCD'[en.quiz[qi]!.ans]}`);
  });
}
