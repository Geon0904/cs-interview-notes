import { useState } from 'react';
import { useLoaderData } from 'react-router';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Inline } from '../components/Blocks';
import { Icon } from '../components/Icon';
import { LangToggle } from '../components/LangToggle';
import { QuizRunner, type QuizEntry } from '../components/QuizRunner';
import type { QuizBank } from '../content/types';
import { useLang } from '../i18n/LangProvider';
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
  const { t } = useLang();
  useDocumentTitle(t.reviewTitle);

  const entries: QuizEntry[] = Object.keys(p.wrong)
    .sort()
    .flatMap((key) => {
      const [tid, qiStr] = key.split(':');
      const b = tid ? bank[tid] : undefined;
      const qi = Number(qiStr);
      const item = b?.items[qi];
      return b && item ? [{ tid: tid!, qi, item, tag: `${tid} ${b.name}` }] : [];
    });

  return (
    <main className="wrap">
      <header className="hero compact">
        <div className="hero-top">
          <span className="eyebrow">{t.reviewEyebrow}</span>
          <LangToggle />
        </div>
        <h1>{t.reviewTitle}</h1>
        <p className="sub">{t.reviewSub}</p>
      </header>

      {session ? (
        <>
          <QuizRunner items={session} review onRestart={() => setSession(null)} />
          <button type="button" className="cta ghost" onClick={() => setSession(null)}>
            {t.backToList}
          </button>
        </>
      ) : entries.length === 0 ? (
        <div className="empty">
          <b>{t.reviewEmptyTitle}</b>
          <span>{t.reviewEmptyBody}</span>
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
            {t.redoWrong(entries.length)} <Icon name="arrow" />
          </button>
          <ul className="wlist">
            {entries.map((e) => (
              <li className="wcard" key={`${e.tid}:${e.qi}`}>
                <span className="tg">
                  {e.tag} · {t.quizNo(e.qi + 1)}
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
                  {t.memorized}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
