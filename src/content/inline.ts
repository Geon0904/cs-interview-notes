/**
 * 콘텐츠 문장 안의 아주 작은 인라인 문법을 토큰으로 나눕니다.
 *   `코드`   → code
 *   **굵게** → bold
 *
 * 왜 HTML 문자열이 아니라 토큰인가요?
 * 예전 버전은 문자열을 이어 붙여 innerHTML에 넣었기 때문에, 이스케이프를 한 번만 빠뜨려도
 * XSS(스크립트 주입)가 생길 수 있었어요. 지금은 토큰 배열을 React 요소로 바꾸므로
 * React가 모든 텍스트를 자동으로 이스케이프합니다. dangerouslySetInnerHTML을 한 번도 쓰지 않아요.
 */
export type InlineToken = { t: 'text' | 'code' | 'bold'; v: string };

export function tokenizeInline(src: string): InlineToken[] {
  const out: InlineToken[] = [];
  // 백틱으로 나누면 홀수 번째 조각이 코드예요. 코드 안의 ** 는 굵게로 바꾸지 않습니다.
  src.split('`').forEach((part, i) => {
    if (i % 2 === 1) {
      out.push({ t: 'code', v: part });
      return;
    }
    const re = /\*\*(.+?)\*\*/g;
    let last = 0;
    for (let m = re.exec(part); m; m = re.exec(part)) {
      if (m.index > last) out.push({ t: 'text', v: part.slice(last, m.index) });
      out.push({ t: 'bold', v: m[1]! });
      last = m.index + m[0].length;
    }
    if (last < part.length) out.push({ t: 'text', v: part.slice(last) });
  });
  return out.filter((tk) => tk.v !== '' || tk.t === 'code');
}

/** "**용어**: 설명" 형태의 단계 항목을 용어/설명으로 나눕니다. 아니면 null. */
export function splitTerm(item: string): { term: string; desc: string } | null {
  const m = /^\*\*([^*]+)\*\*\s*[:：]\s*(.+)$/.exec(item);
  return m ? { term: m[1]!, desc: m[2]! } : null;
}
