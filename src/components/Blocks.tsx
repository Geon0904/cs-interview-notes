import type { Block, LessonField } from '../content/types';
import { commentStart } from '../content/code';
import { splitTerm, tokenizeInline } from '../content/inline';
import { Icon } from './Icon';

/** `코드`와 **굵게**만 있는 문장을 React 요소로 그려요. (텍스트는 React가 자동 이스케이프) */
export function Inline({ text }: { text: string }) {
  return (
    <>
      {tokenizeInline(text).map((tk, i) =>
        tk.t === 'code' ? <code key={i}>{tk.v}</code> : tk.t === 'bold' ? <strong key={i}>{tk.v}</strong> : tk.v,
      )}
    </>
  );
}

export function CodeBlock({ text, lang }: { text: string; lang: string }) {
  const lines = text.split('\n');
  return (
    // tabIndex: 가로 스크롤되는 영역을 키보드로도 스크롤할 수 있게 (접근성)
    <pre className="code" tabIndex={0} aria-label={lang ? `${lang} 코드` : '코드'}>
      {lines.map((l, i) => {
        const c = commentStart(l, lang);
        return (
          <span key={i}>
            {c >= 0 ? (
              <>
                {l.slice(0, c)}
                <span className="cm">{l.slice(c)}</span>
              </>
            ) : (
              l
            )}
            {i < lines.length - 1 ? '\n' : null}
          </span>
        );
      })}
    </pre>
  );
}

export function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className={`tbl${head.length >= 4 ? ' wide' : ''}`} tabIndex={0} role="region" aria-label="표 (가로로 스크롤할 수 있어요)">
      <table>
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={i} scope="col">
                <Inline text={h} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j}>
                  <Inline text={c} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const SIMPLE_LABEL = { easy: '쉽게 이해하기', ans: '면접 답', mem: '기억할 것' } as const;

/** 블록 종류(t)에 따라 알맞은 모양으로 그려요. switch가 모든 경우를 다루지 않으면 TypeScript가 알려 줍니다. */
export function BlockView({ b }: { b: Block }) {
  switch (b.t) {
    case 'easy':
    case 'ans':
    case 'mem':
      return (
        <div className={`blk ${b.t}`}>
          <span className="k">{SIMPLE_LABEL[b.t]}</span>
          <p>
            <Inline text={b.text} />
          </p>
        </div>
      );
    case 'p':
      return (
        <p className="plain">
          <Inline text={b.text} />
        </p>
      );
    case 'table':
      return <Table head={b.head} rows={b.rows} />;
    case 'code':
      return <CodeBlock text={b.text} lang={b.lang} />;
    case 'ol':
      return (
        <ol className="steps">
          {b.items.map((x, i) => (
            <li key={i}>
              <Inline text={x} />
            </li>
          ))}
        </ol>
      );
    case 'ul':
      return (
        <ul className="dots">
          {b.items.map((x, i) => (
            <li key={i}>
              <Inline text={x} />
            </li>
          ))}
        </ul>
      );
    default: {
      const never: never = b; // 새 블록 종류를 추가하고 여기를 빼먹으면 컴파일 오류가 나요.
      return never;
    }
  }
}

/* ---------- 설명(Lesson) 필드 ---------- */

const FIELD_LABEL: Record<LessonField['k'], string> = {
  ONE: '한 줄 정의',
  LIKE: '일상 비유',
  STEP: '하나씩 뜯어보기',
  WHY: '왜 필요할까?',
  USE: '어디에 쓰일까?',
  KEY: '꼭 알아둘 점',
  PRO: '장점',
  CON: '단점',
  END: '결론',
};
const FIELD_CLASS: Partial<Record<LessonField['k'], string>> = { LIKE: 'like', PRO: 'pro', CON: 'con', END: 'end' };

/** 단계 목록: "**용어**: 설명"이면 용어를 한 줄, 설명을 다음 줄에 두어 훑어보기 쉽게 */
function StepList({ items }: { items: string[] }) {
  return (
    <ol className="bsteps">
      {items.map((x, i) => {
        const s = splitTerm(x);
        return (
          <li key={i}>
            {s ? (
              <span>
                <b className="sh">
                  <Inline text={s.term} />
                </b>
                <span className="sd">
                  <Inline text={s.desc} />
                </span>
              </span>
            ) : (
              <span>
                <Inline text={x} />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function SubBlock({ b }: { b: Block }) {
  return b.t === 'ol' ? <StepList items={b.items} /> : <BlockView b={b} />;
}

export function FieldView({ f }: { f: LessonField }) {
  const subs = f.sub.map((b, i) => <SubBlock key={i} b={b} />);
  if (f.k === 'ONE') {
    return (
      <>
        <p className="lone">
          <Inline text={f.text} />
        </p>
        {subs}
      </>
    );
  }
  return (
    <div className={`lf ${FIELD_CLASS[f.k] ?? ''}`}>
      <span className="k">
        {f.k === 'LIKE' && <Icon name="bulb" />}
        {FIELD_LABEL[f.k]}
      </span>
      {f.text && (
        <p>
          <Inline text={f.text} />
        </p>
      )}
      {subs}
    </div>
  );
}
