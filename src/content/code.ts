/**
 * 코드 블록에서 주석만 흐리게 보여 주기 위한 아주 작은 하이라이터.
 * 문법 전체를 색칠하는 라이브러리(수십~수백 KB) 대신, 학습 앱에 꼭 필요한 "주석 구분"만 직접 구현했어요.
 */
const SLASH_LANGS = /^(c|cpp|java|js|javascript|ts|typescript|go|rust)$/;

/**
 * 줄에서 한 줄 주석이 시작되는 위치. 문자열 따옴표 안의 표시는 주석으로 보지 않아요.
 * 예) print("#1")  # 설명   →  '#'는 두 번째 것만 주석
 */
export function commentStart(line: string, lang: string): number {
  let quote: string | null = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quote) {
      if (c === '\\') i++; // 이스케이프된 다음 글자는 건너뜀
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      continue;
    }
    if (lang === 'sql') {
      if (c === '-' && line[i + 1] === '-') return i;
    } else if (SLASH_LANGS.test(lang)) {
      if (c === '/' && line[i + 1] === '/') return i;
    } else if (c === '#') {
      return i;
    }
  }
  return -1;
}
