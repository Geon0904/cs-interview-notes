import { useState } from 'react';
import { useLoaderData } from 'react-router';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Inline } from '../components/Blocks';
import { Icon } from '../components/Icon';
import { QuizRunner, type QuizEntry } from '../components/QuizRunner';
import type { QuizBank } from '../content/types';
import { shuffle } from '../lib/shuffle';
import { useProgress, useProgressDispatch } from '../state/ProgressProvider';

const LETTERS = 'ABCD';

/** 오답 노트: 틀린 문제가 자동으로 모이고, 다시 맞히거나 '외웠어요'를 누르면 사라져요. */
export default function Review() {
  const bank = useLoaderData() as QuizBank;
  const p = useProgress();
  const dispatch = useProgressDispatch();
  // 다시 풀기를 시작한 순간의 문제 목록을 고정 (풀면서 오답이 지워져도 진행 중인 퀴즈는 그대로)
  const [session, setSession] = useState<QuizEntry[] | null>(null);
  useDocumentTitle('오답 노트');

  const entries: QuizEntry[] = Object.keys(p.wrong)
    .sort()
    .flatMap((key) => {
      const [tid, qiStr] = key.split(':');
      const b = tid ? bank[tid] : undefined;
      const qi = Number(qiStr);
      const item = b?.items[qi];
      return b && item ? [{ tid: tid!, qi, item, tag: `${tid} ${b.ko}` }] : [];
    });

  return (
    <main className="wrap">
      <header className="hero compact">
        <span className="eyebrow">Wrong Answers</span>
        <h1>오답 노트</h1>
        <p className="sub">틀린 문제가 자동으로 모입니다. 다시 맞히면 사라져요.</p>
      </header>

      {session ? (
        <>
          <QuizRunner items={session} review onRestart={() => setSession(null)} />
          <button type="button" className="cta ghost" onClick={() => setSession(null)}>
            목록으로
          </button>
        </>
      ) : entries.length === 0 ? (
        <div className="empty">
          <b>아직 오답이 없어요</b>
          <span>주제별 퀴즈나 랜덤 퀴즈에서 틀린 문제가 여기에 쌓입니다.</span>
        </div>
      ) : (
        <>
          <button
            type="button"
            className="cta"
            onClick={() => {
              setSession(shuffle(entries));
              window.scrollTo(0, 0);
            }}
          >
            오답 {entries.length}문제 다시 풀기 <Icon name="arrow" />
          </button>
          <ul className="wlist">
            {entries.map((e) => (
              <li className="wcard" key={`${e.tid}:${e.qi}`}>
                <span className="tg">
                  {e.tag} · 퀴즈 {e.qi + 1}
                </span>
                <p className="q">
                  <Inline text={e.item.q} />
                </p>
                <p className="a">
                  <b>{LETTERS[e.item.ans]}</b> <Inline text={e.item.opts[e.item.ans]} />
                </p>
                <p className="x">
                  <Inline text={e.item.exp} />
                </p>
                <button type="button" className="rm" onClick={() => dispatch({ type: 'wrong/remove', key: `${e.tid}:${e.qi}` })}>
                  외웠어요, 지우기
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
