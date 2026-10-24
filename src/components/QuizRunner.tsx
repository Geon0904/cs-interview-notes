import { useState, type ReactNode } from 'react';
import type { QuizItem } from '../content/types';
import { useLang } from '../i18n/LangProvider';
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
  const { t } = useLang();
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);

  if (items.length === 0) {
    return (
      <div className="empty">
        <b>{t.noQuestionsTitle}</b>
        <span>{t.noQuestionsBody}</span>
      </div>
    );
  }

  const score = results.filter(Boolean).length;

  if (done) {
    const n = items.length;
    const r = score / n;
    const msg = r === 1 ? t.resultPerfect : r >= 0.7 ? t.resultGood : t.resultRetry;
    return (
      <>
        <section className="card result" aria-live="polite">
          <span className="eyebrow">{t.result}</span>
          <span className="big">
            {score}
            <small> / {n}</small>
          </span>
          <p>{msg}</p>
        </section>
        <div className="stack">
          <button type="button" className="cta" onClick={onRestart}>
            {t.retry}
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
          <span>{t.questionOf(i + 1, items.length)}</span>
          <span>{t.correctSoFar(score)}</span>
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
            <b>{correct ? t.correct : t.wrongAnswer(LETTERS[q.ans]!)}</b>
            <p>
              <Inline text={q.exp} />
            </p>
          </div>
          <button type="button" className="cta" onClick={next}>
            {i + 1 < items.length ? t.nextQuestion : t.seeResult} <Icon name="arrow" />
          </button>
        </>
      ) : (
        <button type="button" className="cta" disabled={picked === null} onClick={check}>
          {t.check}
        </button>
      )}
    </div>
  );
}
