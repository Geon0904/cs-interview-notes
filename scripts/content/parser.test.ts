import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildIndex, buildQuizBank, checkParity, STAGES } from './assemble';
import { ContentError, parseTopic } from './parser';

const HEAD = ['@id 99', '@ko 테스트', '@en Test', '@desc d', '@analogy a', '@intro i', '@one o', ''].join('\n');
const QUIZ = ['## QUIZ', '? 질문', '- 가', '- 나', '- 다', '- 라', '= B', '! 해설'].join('\n');
const doc = (body: string) => `${HEAD}\n${body}\n${QUIZ}\n`;

describe('parseTopic', () => {
  it('섹션·설명·카드·퀴즈를 올바른 구조로 만든다', () => {
    const t = parseTopic(
      doc(
        [
          '## 섹션 A',
          'P: 소개 문단',
          '#### 설명 1',
          'ONE: 한 줄',
          'LIKE: 비유',
          'STEP:',
          '1. **용어**: 설명',
          '2. 두 번째',
          'END: 결론',
          '### Q. 질문 1',
          'E: 쉽게',
          'A: 답',
          '| 머리 | 글 |',
          '| a \\| b | c |',
        ].join('\n'),
      ),
      'x.md',
    );
    expect(t.id).toBe('99');
    const s = t.sections[0]!;
    expect(s.title).toBe('섹션 A');
    expect(s.intro).toEqual([{ t: 'p', text: '소개 문단' }]);
    expect(s.lessons[0]!.fields.map((f) => f.k)).toEqual(['ONE', 'LIKE', 'STEP', 'END']);
    // STEP 아래 목록은 STEP 필드의 sub로 묶여요.
    expect(s.lessons[0]!.fields[2]!.sub).toEqual([{ t: 'ol', items: ['**용어**: 설명', '두 번째'] }]);
    // "Q. " 접두어는 지워져요.
    expect(s.cards[0]!.q).toBe('질문 1');
    // 표 안의 \| 는 글자 | 로 바뀌어요.
    expect(s.cards[0]!.blocks[2]).toEqual({ t: 'table', head: ['머리', '글'], rows: [['a | b', 'c']] });
    expect(t.quiz).toEqual([{ q: '질문', opts: ['가', '나', '다', '라'], ans: 1, exp: '해설' }]);
  });

  it('코드 블록은 안의 줄을 그대로 보존한다', () => {
    const t = parseTopic(doc(['## S', '### Q', '```python', 'x = 1  # 주석', '', 'E: 이건 코드 안', '```'].join('\n')), 'x.md');
    expect(t.sections[0]!.cards[0]!.blocks[0]).toEqual({ t: 'code', lang: 'python', text: 'x = 1  # 주석\n\nE: 이건 코드 안' });
  });

  it('형식 오류는 파일과 줄 번호를 알려 준다', () => {
    const src = doc(['## S', '### Q', 'E: ok', '이상한 줄'].join('\n'));
    expect(() => parseTopic(src, 'bad.md')).toThrowError(/^bad\.md:12 알 수 없는 줄/);
  });

  it.each([
    ['필수 필드(LIKE)가 빠진 설명', ['## S', '#### L', 'ONE: a', 'STEP:', '1. x', 'END: b', '### Q', 'E: e'], /LIKE: 필드가 없어요/],
    ['설명 안의 문단 블록(예전 버그)', ['## S', '#### L', 'ONE: a', 'LIKE: b', 'STEP: c', 'END: d', '', 'P: 섹션 소개', '### Q', 'E: e'], /설명 안에는 P: 블록을/],
    ['카드 없는 섹션', ['## S', 'P: 소개만'], /문답 카드가 없어요/],
    ['닫히지 않은 코드', ['## S', '### Q', '```js', 'x'], /코드 블록이 닫히지 않았어요/],
    ['칸 수가 다른 표', ['## S', '### Q', '| a | b |', '| c |'], /표의 칸 수가 맞지 않아요/],
    ['카드 뒤에 오는 설명', ['## S', '### Q', 'E: e', '#### L'], /설명\(####\)은 문답 카드/],
    ['중복 섹션', ['## S', '### Q', 'E: e', '## S', '### Q', 'E: e'], /섹션 제목이 중복돼요/],
  ])('%s → 빌드 실패', (_, lines, msg) => {
    expect(() => parseTopic(doc(lines.join('\n')), 'x.md')).toThrowError(msg);
  });

  it.each([
    ['보기 3개', ['? q', '- a', '- b', '- c', '= A', '! e'], /보기는 4개/],
    ['정답 E', ['? q', '- a', '- b', '- c', '- d', '= E', '! e'], /A, B, C, D 중 하나/],
    ['해설 없음', ['? q', '- a', '- b', '- c', '- d', '= A'], /해설/],
  ])('퀴즈 %s → 빌드 실패', (_, quiz, msg) => {
    const src = `${HEAD}\n## S\n### Q\nE: e\n## QUIZ\n${quiz.join('\n')}\n`;
    expect(() => parseTopic(src, 'x.md')).toThrowError(msg);
  });

  it('메타데이터가 빠지면 실패한다', () => {
    expect(() => parseTopic(`@id 1\n## S\n### Q\nE: e\n${QUIZ}`, 'x.md')).toThrowError(ContentError);
  });
});

describe('실제 콘텐츠 (content/*.md)', () => {
  const dir = join(import.meta.dirname, '..', '..', 'content');
  const topics = readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((f) => parseTopic(readFileSync(join(dir, f), 'utf8'), f));

  it('16개 주제가 모두 오류 없이 파싱되고 단계 구성과 맞는다', () => {
    expect(topics.map((t) => t.id)).toEqual(STAGES.flatMap((s) => s.topics));
    const index = buildIndex(topics, STAGES);
    expect(index.topics.every((t) => t.hasLessons)).toBe(true);
  });

  it('모든 설명에 필수 필드가 있고, 퀴즈 정답이 한쪽 보기로 쏠리지 않는다', () => {
    const answers = topics.flatMap((t) => t.quiz.map((q) => q.ans));
    const counts = [0, 1, 2, 3].map((a) => answers.filter((x) => x === a).length);
    // 정답 위치가 한 보기에 40% 넘게 몰리면 "찍기"로 맞힐 수 있어요.
    for (const c of counts) expect(c / answers.length).toBeLessThan(0.4);
  });

  it('퀴즈 묶음은 모든 주제의 문항을 담는다', () => {
    const bank = buildQuizBank(topics, 'ko');
    expect(Object.keys(bank)).toHaveLength(16);
    expect(Object.values(bank).reduce((n, b) => n + b.items.length, 0)).toBe(topics.reduce((n, t) => n + t.quiz.length, 0));
  });
});

describe('buildIndex', () => {
  const t = parseTopic(doc('## S\n### Q\nE: e'), 'x.md');
  it('단계에 없는 주제가 있으면 실패한다', () => {
    expect(() => buildIndex([t], [])).toThrowError(/어느 단계에도 없어요/);
  });
  it('단계에 존재하지 않는 주제 번호가 있으면 실패한다', () => {
    expect(() => buildIndex([t], [{ key: 'base', topics: ['99', '00'] }])).toThrowError(/없는 주제 00/);
  });
});

describe('checkParity (번역본 구조 검사)', () => {
  const base = [
    '## S',
    '#### L',
    'ONE: a',
    'LIKE: b',
    'STEP:',
    '1. x',
    '2. y',
    'END: c',
    '### Q',
    'E: e',
    'A: a',
  ];
  const ko = parseTopic(doc(base.join('\n')), 'ko.md');
  const en = (lines: string[], quiz = QUIZ) => parseTopic(`${HEAD}\n${lines.join('\n')}\n${quiz}\n`, 'en.md');

  it('글자만 다르고 구조가 같으면 통과', () => {
    const translated = base.map((l) => l.replace(/: .+$/, ': translated').replace(/^\d\. .+$/, (m) => m.slice(0, 3) + 'item'));
    expect(() => checkParity(ko, en(translated), 'en.md')).not.toThrow();
  });
  it.each([
    ['문답이 빠지면', base.filter((l) => l !== 'A: a'), /문답 1/],
    ['단계 항목 수가 다르면', base.filter((l) => l !== '2. y'), /ol 2.*ol 1/],
    ['필드 구성이 다르면', base.flatMap((l) => (l.startsWith('END') ? ['KEY: k', l] : [l])), /필드/],
  ])('%s 실패', (_, lines, msg) => {
    expect(() => checkParity(ko, en(lines), 'en.md')).toThrowError(msg);
  });
  it('퀴즈 정답 위치가 바뀌면 실패', () => {
    expect(() => checkParity(ko, en(base, QUIZ.replace('= B', '= C')), 'en.md')).toThrowError(/정답 B vs C/);
  });
});
