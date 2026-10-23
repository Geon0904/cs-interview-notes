import { describe, expect, it } from 'vitest';
import { shuffle } from '../lib/shuffle';
import { parseSection, topicPath } from '../routes';
import { cardKey, firstOpenCard, initialProgress, nextOpenCard, progressReducer, sectionDone, type Progress } from './progress';

const run = (...actions: Parameters<typeof progressReducer>[1][]) => actions.reduce(progressReducer, initialProgress);

describe('progressReducer', () => {
  it('원래 상태를 바꾸지 않고 새 객체를 돌려준다 (불변성)', () => {
    const before = structuredClone(initialProgress);
    const next = progressReducer(initialProgress, { type: 'card/mark', key: 'a', mark: 'ok' });
    expect(initialProgress).toEqual(before);
    expect(next).not.toBe(initialProgress);
    expect(next.cards).toEqual({ a: 'ok' });
  });

  it('다시 볼래요는 누를 때마다 켜고 끈다', () => {
    const once = run({ type: 'card/toggleAgain', key: 'k' });
    expect(once.cards.k).toBe('again');
    expect(progressReducer(once, { type: 'card/toggleAgain', key: 'k' }).cards).toEqual({});
  });

  it('틀리면 오답 노트에 넣고, 오답 노트 모드에서 맞히면 뺀다', () => {
    const wrong = run({ type: 'quiz/answer', tid: '02', qi: 0, correct: false, review: false });
    expect(wrong.wrong).toEqual({ '02:0': true });
    // 일반 퀴즈에서 맞히는 건 오답 노트를 건드리지 않아요.
    expect(progressReducer(wrong, { type: 'quiz/answer', tid: '02', qi: 0, correct: true, review: false })).toBe(wrong);
    expect(progressReducer(wrong, { type: 'quiz/answer', tid: '02', qi: 0, correct: true, review: true }).wrong).toEqual({});
  });

  it('퀴즈 최고 점수는 내려가지 않는다', () => {
    const s = run({ type: 'quiz/finish', tid: '01', score: 7, n: 8 }, { type: 'quiz/finish', tid: '01', score: 3, n: 8 });
    expect(s.quiz['01']).toEqual({ best: 7, last: 3, n: 8 });
  });

  it('같은 위치를 다시 방문하면 같은 상태 객체를 돌려준다 (불필요한 리렌더 방지)', () => {
    const s = run({ type: 'visit', tid: '03', sec: 2, tab: 'qa' });
    expect(progressReducer(s, { type: 'visit', tid: '03', sec: 2, tab: 'qa' })).toBe(s);
  });
});

describe('카드 진도 계산', () => {
  const p: Progress = { ...initialProgress, cards: { [cardKey('01', 0, 0)]: 'ok', [cardKey('01', 0, 2)]: 'again' } };
  it('섹션의 이해한 카드 수', () => expect(sectionDone(p, '01', 0, 4)).toBe(1));
  it('아직 이해하지 못한 첫 카드', () => expect(firstOpenCard(p, '01', 0, 4)).toBe(1));
  it('다음 카드는 끝에서 처음으로 한 바퀴 돈다', () => expect(nextOpenCard(p, '01', 0, 4, 3)).toBe(1));
  it('모두 이해했으면 -1', () => {
    const all: Progress = { ...initialProgress, cards: { '01:0:0': 'ok', '01:0:1': 'ok' } };
    expect(nextOpenCard(all, '01', 0, 2, 0)).toBe(-1);
  });
});

describe('주소 규칙', () => {
  it('섹션은 주소에서 1부터, 내부에서는 0부터', () => {
    expect(topicPath('07', 'learn', 0)).toBe('/topic/07/learn');
    expect(topicPath('07', 'qa', 2)).toBe('/topic/07/qa?s=3');
    expect(parseSection('3', 10)).toBe(2);
  });
  it.each([null, '0', '11', 'abc', '1.5'])('잘못된 섹션 값 %s → 첫 섹션', (v) => expect(parseSection(v, 10)).toBe(0));
});

describe('shuffle', () => {
  it('원본을 바꾸지 않고 같은 원소를 모두 담는다', () => {
    const a = [1, 2, 3, 4, 5];
    const b = shuffle(a);
    expect(a).toEqual([1, 2, 3, 4, 5]);
    expect([...b].sort()).toEqual(a);
  });
  it('난수를 주입하면 결과가 정해진다', () => {
    // rand가 항상 0이면 매번 맨 앞 원소와 바꿔요: [1,2,3] → [2,3,1]
    expect(shuffle([1, 2, 3], () => 0)).toEqual([2, 3, 1]);
  });
  it('모든 순서가 고르게 나온다 (통계 검사)', () => {
    const counts = new Map<string, number>();
    const N = 60000;
    for (let i = 0; i < N; i++) {
      const k = shuffle([1, 2, 3]).join('');
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    expect(counts.size).toBe(6);
    for (const c of counts.values()) expect(Math.abs(c / N - 1 / 6)).toBeLessThan(0.01);
  });
});
