import { describe, expect, it } from 'vitest';
import { commentStart } from './code';
import { splitTerm, tokenizeInline } from './inline';

describe('tokenizeInline', () => {
  it('코드와 굵게를 나눈다', () => {
    expect(tokenizeInline('a `x` **b** c')).toEqual([
      { t: 'text', v: 'a ' },
      { t: 'code', v: 'x' },
      { t: 'text', v: ' ' },
      { t: 'bold', v: 'b' },
      { t: 'text', v: ' c' },
    ]);
  });
  it('코드 안의 ** 는 굵게로 바꾸지 않는다', () => {
    expect(tokenizeInline('`a**b**c`')).toEqual([{ t: 'code', v: 'a**b**c' }]);
  });
  it('HTML처럼 보이는 글자도 그대로 텍스트로 둔다 (React가 이스케이프)', () => {
    expect(tokenizeInline('<script>alert(1)</script>')).toEqual([{ t: 'text', v: '<script>alert(1)</script>' }]);
  });
});

describe('splitTerm', () => {
  it('"**용어**: 설명"을 나눈다 (전각 콜론도)', () => {
    expect(splitTerm('**Stack**: 접시 쌓기')).toEqual({ term: 'Stack', desc: '접시 쌓기' });
    expect(splitTerm('**큐**： 줄 서기')).toEqual({ term: '큐', desc: '줄 서기' });
    expect(splitTerm('그냥 문장 **굵게** 포함')).toBeNull();
  });
});

describe('commentStart', () => {
  it.each([
    ['x = 1  # 설명', 'python', 7],
    ['print("#1")  # 진짜 주석', 'python', 13],
    ["s = 'it\\'s # not'", 'python', -1],
    ['int x; // c', 'cpp', 7],
    ['url = "http://a"', 'js', -1],
    ['SELECT 1 -- 주석', 'sql', 9],
    ['a - b', 'sql', -1],
  ])('%s (%s) → %i', (line, lang, at) => {
    expect(commentStart(line, lang)).toBe(at);
  });
});
