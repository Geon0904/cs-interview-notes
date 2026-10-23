/**
 * content/*.md 를 읽어 Topic 객체로 바꾸는 파서.
 *
 * 설계 원칙
 * 1. 순수 함수: 파일을 직접 읽지 않고 문자열만 받아요. 그래서 단위 테스트가 쉽습니다.
 * 2. 줄 단위(Line-Based) 파싱: 콘텐츠 문법이 "줄의 앞부분 표시"로만 정해져 있어서
 *    (`## `, `### `, `#### `, `E: `, `| ` ...) 정규식 몇 개와 반복문으로 충분해요.
 *    범용 Markdown 라이브러리보다 작고, 우리 문법에 없는 줄은 바로 오류로 잡을 수 있어요.
 * 3. 빠르게 실패(Fail Fast): 형식이 틀리면 "파일:줄 번호"와 함께 예외를 던져 빌드를 멈춥니다.
 *    잘못된 콘텐츠가 조용히 배포되는 것보다, 빌드가 실패하는 편이 훨씬 안전해요.
 *
 * 문서 구조
 *   @id 01 / @ko ... (메타데이터)
 *   ## 섹션 제목
 *     (섹션 소개 블록)
 *     #### 설명 제목      ← ONE: / LIKE: / STEP: ... 필드
 *     ### 문답 질문       ← E: / A: / M: 블록
 *   ## QUIZ
 *     ? 질문 / - 보기 ×4 / = 정답 / ! 해설
 */
import {
  FIELD_KEYS,
  REQUIRED_FIELDS,
  type Block,
  type Card,
  type FieldKey,
  type Lesson,
  type LessonField,
  type QuizItem,
  type Section,
  type Topic,
} from '../../src/content/types';

/** 원본 줄 번호를 함께 들고 다녀서, 오류 메시지에 정확한 위치를 보여 줍니다. */
interface Line {
  text: string;
  no: number;
}

export class ContentError extends Error {
  constructor(file: string, line: number | null, message: string) {
    super(`${file}${line ? `:${line}` : ''} ${message}`);
    this.name = 'ContentError';
  }
}

const FIELD_RE = new RegExp(`^(${FIELD_KEYS.join('|')}):\\s?(.*)$`);
const SIMPLE_RE = /^([EAMP]): (.*)$/;
const OL_RE = /^\d+\. /;
const SIMPLE_KIND = { E: 'easy', A: 'ans', M: 'mem', P: 'p' } as const;
const META_KEYS = ['id', 'ko', 'en', 'desc', 'analogy', 'intro', 'one'] as const;

/** `| a | b \| c |` → ['a', 'b | c']  (`\|`는 셀 안의 글자 '|') */
function splitRow(text: string): string[] {
  const inner = text.trim().slice(1, -1);
  return inner.split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|'));
}

/**
 * 블록 파서. 빈 줄은 건너뛰고, 줄의 시작 표시로 블록 종류를 정합니다.
 * `fields=true`이면 설명(Lesson) 본문으로 보고 ONE:/LIKE: 같은 필드 줄을 허용합니다.
 * 반환값은 (블록 | 필드) 목록이며, 필드 묶기는 parseLessonBody가 합니다.
 */
function parseBlocks(lines: Line[], file: string, fields: boolean): (Block | LessonField)[] {
  const out: (Block | LessonField)[] = [];
  let i = 0;
  while (i < lines.length) {
    const ln = lines[i]!;
    const text = ln.text;
    if (!text.trim()) {
      i++;
      continue;
    }

    // 표: '|'로 시작하는 줄이 이어지는 동안
    if (text.startsWith('|')) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i]!.text.startsWith('|')) rows.push(splitRow(lines[i++]!.text));
      const [head, ...body] = rows;
      if (!head || body.length === 0) throw new ContentError(file, ln.no, '표에는 머리글과 한 줄 이상의 본문이 필요해요');
      for (const r of body) {
        if (r.length !== head.length) throw new ContentError(file, ln.no, `표의 칸 수가 맞지 않아요 (${head.length} vs ${r.length})`);
      }
      out.push({ t: 'table', head, rows: body });
      continue;
    }

    // 코드: ``` 부터 다음 ``` 까지
    if (text.startsWith('```')) {
      const lang = text.slice(3).trim();
      let j = i + 1;
      while (j < lines.length && !lines[j]!.text.startsWith('```')) j++;
      if (j >= lines.length) throw new ContentError(file, ln.no, '코드 블록이 닫히지 않았어요');
      out.push({ t: 'code', lang, text: lines.slice(i + 1, j).map((l) => l.text).join('\n') });
      i = j + 1;
      continue;
    }

    if (OL_RE.test(text)) {
      const items: string[] = [];
      while (i < lines.length && OL_RE.test(lines[i]!.text)) items.push(lines[i++]!.text.replace(OL_RE, ''));
      out.push({ t: 'ol', items });
      continue;
    }

    if (text.startsWith('- ')) {
      const items: string[] = [];
      while (i < lines.length && lines[i]!.text.startsWith('- ')) items.push(lines[i++]!.text.slice(2));
      out.push({ t: 'ul', items });
      continue;
    }

    const f = FIELD_RE.exec(text);
    if (f && fields) {
      out.push({ k: f[1] as FieldKey, text: (f[2] ?? '').trim(), sub: [] });
      i++;
      continue;
    }

    const s = SIMPLE_RE.exec(text);
    if (s) {
      if (fields) {
        // 이전 버전에서 섹션 소개 문단이 마지막 설명의 '결론' 안으로 섞여 들어간 버그가 있었어요.
        // 설명 안에는 문단 블록을 두지 않는다는 규칙으로 같은 실수를 빌드 단계에서 막습니다.
        throw new ContentError(file, ln.no, `설명 안에는 ${s[1]}: 블록을 쓸 수 없어요. 섹션 소개라면 첫 #### 위로 옮겨 주세요`);
      }
      out.push({ t: SIMPLE_KIND[s[1] as keyof typeof SIMPLE_KIND], text: s[2]! });
      i++;
      continue;
    }

    throw new ContentError(file, ln.no, `알 수 없는 줄이에요: ${JSON.stringify(text.slice(0, 60))}`);
  }
  return out;
}

function isField(b: Block | LessonField): b is LessonField {
  return 'k' in b;
}

function parsePlainBlocks(lines: Line[], file: string): Block[] {
  return parseBlocks(lines, file, false) as Block[];
}

/** 설명 본문: 필드 줄 뒤에 오는 목록·표·코드는 그 필드의 sub로 묶어요. */
function parseLessonBody(title: string, titleLine: number, body: Line[], file: string): Lesson {
  const fields: LessonField[] = [];
  for (const b of parseBlocks(body, file, true)) {
    if (isField(b)) fields.push(b);
    else if (fields.length) fields[fields.length - 1]!.sub.push(b);
    else throw new ContentError(file, titleLine, `설명 "${title}"의 첫 필드 앞에 내용이 있어요`);
  }
  const keys = new Set(fields.map((f) => f.k));
  for (const k of REQUIRED_FIELDS) {
    if (!keys.has(k)) throw new ContentError(file, titleLine, `설명 "${title}"에 ${k}: 필드가 없어요`);
  }
  for (const f of fields) {
    if (!f.text && f.sub.length === 0) throw new ContentError(file, titleLine, `설명 "${title}"의 ${f.k}: 필드가 비어 있어요`);
  }
  return { title, fields };
}

function parseSection(title: string, headLine: number, lines: Line[], file: string): Section {
  const intro: Line[] = [];
  const lessons: { title: string; no: number; body: Line[] }[] = [];
  const cards: { q: string; no: number; body: Line[] }[] = [];

  // 순서: 소개 → 설명들(####) → 문답 카드들(###)
  for (const ln of lines) {
    if (ln.text.startsWith('#### ')) {
      if (cards.length) throw new ContentError(file, ln.no, '설명(####)은 문답 카드(###)보다 앞에 있어야 해요');
      lessons.push({ title: ln.text.slice(5).trim(), no: ln.no, body: [] });
    } else if (ln.text.startsWith('### ')) {
      cards.push({ q: ln.text.slice(4).trim().replace(/^Q\.\s*/, ''), no: ln.no, body: [] });
    } else if (cards.length) {
      cards[cards.length - 1]!.body.push(ln);
    } else if (lessons.length) {
      lessons[lessons.length - 1]!.body.push(ln);
    } else {
      intro.push(ln);
    }
  }

  if (cards.length === 0) throw new ContentError(file, headLine, `섹션 "${title}"에 문답 카드가 없어요`);

  return {
    title,
    intro: parsePlainBlocks(intro, file),
    lessons: lessons.map((l) => parseLessonBody(l.title, l.no, l.body, file)),
    cards: cards.map((c): Card => {
      const blocks = parsePlainBlocks(c.body, file);
      if (blocks.length === 0) throw new ContentError(file, c.no, `문답 "${c.q}"의 내용이 비어 있어요`);
      return { q: c.q, blocks };
    }),
  };
}

function parseQuiz(lines: Line[], file: string): QuizItem[] {
  type Draft = { q: string; no: number; opts: string[]; ans: number | null; exp: string };
  const drafts: Draft[] = [];
  for (const ln of lines) {
    const t = ln.text;
    if (!t.trim()) continue;
    const cur = drafts[drafts.length - 1];
    if (t.startsWith('? ')) drafts.push({ q: t.slice(2), no: ln.no, opts: [], ans: null, exp: '' });
    else if (!cur) throw new ContentError(file, ln.no, '퀴즈 질문(? ) 앞에 다른 줄이 있어요');
    else if (t.startsWith('- ')) cur.opts.push(t.slice(2));
    else if (t.startsWith('= ')) {
      const idx = 'ABCD'.indexOf(t.slice(2).trim());
      if (idx < 0 || t.slice(2).trim().length !== 1) throw new ContentError(file, ln.no, '정답은 A, B, C, D 중 하나여야 해요');
      cur.ans = idx;
    } else if (t.startsWith('! ')) cur.exp = t.slice(2);
    else throw new ContentError(file, ln.no, `알 수 없는 퀴즈 줄이에요: ${JSON.stringify(t.slice(0, 60))}`);
  }
  return drafts.map((d) => {
    if (d.opts.length !== 4) throw new ContentError(file, d.no, `퀴즈 보기는 4개여야 해요 (지금 ${d.opts.length}개)`);
    if (d.ans === null) throw new ContentError(file, d.no, '퀴즈 정답(= )이 없어요');
    if (!d.exp) throw new ContentError(file, d.no, '퀴즈 해설(! )이 없어요');
    return { q: d.q, opts: d.opts as QuizItem['opts'], ans: d.ans as QuizItem['ans'], exp: d.exp };
  });
}

/** 파일 하나(주제 하나)를 파싱합니다. */
export function parseTopic(source: string, file: string): Topic {
  const lines: Line[] = source.replace(/\r\n/g, '\n').split('\n').map((text, i) => ({ text, no: i + 1 }));

  // 1) 머리말: 첫 '## ' 전까지. '@키 값'은 메타데이터, 나머지는 소개 블록.
  const meta: Record<string, string> = {};
  const headExtra: Line[] = [];
  let i = 0;
  for (; i < lines.length && !lines[i]!.text.startsWith('## '); i++) {
    const t = lines[i]!.text;
    if (t.startsWith('@')) {
      const sp = t.indexOf(' ');
      const key = sp < 0 ? t.slice(1) : t.slice(1, sp);
      meta[key] = sp < 0 ? '' : t.slice(sp + 1).trim();
    } else if (t.trim()) headExtra.push(lines[i]!);
  }
  for (const k of META_KEYS) {
    if (!meta[k]) throw new ContentError(file, null, `@${k} 메타데이터가 없어요`);
  }

  // 2) 섹션 나누기
  const chunks: { title: string; no: number; body: Line[] }[] = [];
  for (; i < lines.length; i++) {
    const ln = lines[i]!;
    if (ln.text.startsWith('## ')) chunks.push({ title: ln.text.slice(3).trim(), no: ln.no, body: [] });
    else chunks[chunks.length - 1]!.body.push(ln);
  }

  const sections: Section[] = [];
  let quiz: QuizItem[] = [];
  const seen = new Set<string>();
  for (const c of chunks) {
    if (seen.has(c.title)) throw new ContentError(file, c.no, `섹션 제목이 중복돼요: ${c.title}`);
    seen.add(c.title);
    if (c.title === 'QUIZ') quiz = parseQuiz(c.body, file);
    else sections.push(parseSection(c.title, c.no, c.body, file));
  }
  if (sections.length === 0) throw new ContentError(file, null, '섹션이 하나도 없어요');
  if (quiz.length === 0) throw new ContentError(file, null, '퀴즈(## QUIZ)가 없어요');

  return {
    id: meta.id!,
    ko: meta.ko!,
    en: meta.en!,
    desc: meta.desc!,
    analogy: meta.analogy!,
    intro: meta.intro!,
    one: meta.one!,
    introBlocks: parsePlainBlocks(headExtra, file),
    sections,
    quiz,
  };
}
