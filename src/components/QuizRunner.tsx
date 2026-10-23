import { useState, type ReactNode } from 'react';
import type { QuizItem } from '../content/types';
import { useProgressDispatch } from '../state/ProgressProvider';
import { Inline } from './Blocks';
import { Icon } from './Icon';

export interface QuizEntry {
  tid: string;
  qi: number;
  item: QuizItem;
  /** 여러 주제를 섞어 풀 때 보여 줄 주제 표시 (예: "07 알고리즘") */
  tag?: string;
}

interface Props {
  items: QuizEntry[];
  /** 오답 노트 모드에서는 맞힌 문제를 오답 노트에서 지워요. */
  review?: boolean;
  /** 마지막 문제까지 풀었을 때 (점수 기록용) */
  onFinish?: (score: number, n: number) => void;
  /** 결과 화면의 '다시 풀기' */
  onRestart: () => void;
  /** 결과 화면에 추가할 버튼들 */
  resultActions?: (score: number, n: number) => ReactNode;
}

const LETTERS = 'ABCD';

/**
 * 퀴즈 진행기. 주제 퀴즈·랜덤 퀴즈·오답 노트가 모두 이 컴포넌트 하나를 씁니다.
 * 진행 상태(몇 번째 문제, 고른 보기, 결과)는 이 퀴즈 안에서만 의미가 있으니 지역 상태(useState)로 두고,
 * 앱 전체가 알아야 하는 결과(오답·점수)만 전역 진도(dispatch)로 보냅니다.
 */
export function QuizRunner({ items, review = false, onFinish, onRestart, resultActions }: Props) {
  const dispatch = useProgressDispatch();
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);

  if (items.length === 0) {
    return (
      <div className="empty">
        <b>풀 문제가 없어요</b>
        <span>오답이 생기면 여기서 다시 풀 수 있습니다.</span>
      </div>
    );
  }

  const score = results.filter(Boolean).length;

  if (done) {
    const n = items.length;
    const r = score / n;
    const msg =
      r === 1
        ? '전부 맞혔어요. 면접 답을 소리 내어 한 번 더 말해 보세요.'
        : r >= 0.7
          ? '거의 다 왔어요. 틀린 문제는 오답 노트에 모아 두었습니다.'
          : '문답을 한 번 더 보고 다시 풀어 보세요. 틀린 문제는 오답 노트에 있습니다.';
    return (
      <>
        <section className="card result" aria-live="polite">
          <span className="eyebrow">결과</span>
          <span className="big">
            {score}
            <small> / {n}</small>
          </span>
          <p>{msg}</p>
        </section>
        <div className="stack">
          <button type="button" className="cta" onClick={onRestart}>
            다시 풀기
          </button>
          {resultActions?.(score, n)}
        </div>
      </>
    );
  }

  const cur = items[i]!;
  const q = cur.item;
  const correct = picked === q.ans;

  const check = () => {
    if (picked === null) return;
    setChecked(true);
    setResults((r) => [...r, correct]);
    dispatch({ type: 'quiz/answer', tid: cur.tid, qi: cur.qi, correct, review });
  };

  const next = () => {
    if (i + 1 < items.length) {
      setI(i + 1);
      setPicked(null);
      setChecked(false);
    } else {
      setDone(true);
      onFinish?.(score, items.length);
    }
    window.scrollTo(0, 0);
  };

  return (
    <div className="qz">
      <div className="qprog">
        <div className="row">
          <span>
            문제 {i + 1} / {items.length}
          </span>
          <span>맞힌 문제 {score}</span>
        </div>
        <div className="segs" aria-hidden="true">
          {items.map((_, j) => (
            <i key={j} className={j < results.length ? (results[j] ? 'ok' : 'no') : j === i ? 'cur' : ''} />
          ))}
        </div>
      </div>
      {cur.tag && <span className="qtag">{cur.tag}</span>}
      <p className="qtext" id="qtext">
        <Inline text={q.q} />
      </p>
      <div className="opts" role="group" aria-labelledby="qtext">
        {q.opts.map((o, j) => {
          let cls = 'opt';
          if (checked) {
            if (j === q.ans) cls += ' right';
            else if (j === picked) cls += ' wrong';
          } else if (j === picked) cls += ' pick';
          return (
            <button key={j} type="button" className={cls} disabled={checked} aria-pressed={j === picked} onClick={() => setPicked(j)}>
              <span className="l">{LETTERS[j]}</span>
              <span className="o">
                <Inline text={o} />
              </span>
            </button>
          );
        })}
      </div>
      {checked ? (
        <>
          <div className={`fb ${correct ? 'right' : 'wrong'}`} role="status">
            <b>{correct ? '정답입니다' : `아쉬워요 · 정답은 ${LETTERS[q.ans]}`}</b>
            <p>
              <Inline text={q.exp} />
            </p>
          </div>
          <button type="button" className="cta" onClick={next}>
            {i + 1 < items.length ? '다음 문제' : '결과 보기'} <Icon name="arrow" />
          </button>
        </>
      ) : (
        <button type="button" className="cta" disabled={picked === null} onClick={check}>
          정답 확인
        </button>
      )}
    </div>
  );
}
