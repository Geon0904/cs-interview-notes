import { useState } from 'react';
import { Link, useLoaderData, useSearchParams } from 'react-router';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { QuizRunner, type QuizEntry } from '../components/QuizRunner';
import { LangToggle } from '../components/LangToggle';
import { StageChips } from '../components/StageChips';
import { INDEX, parseStage } from '../content/load';
import { useLang } from '../i18n/LangProvider';
import type { QuizBank, StageKey } from '../content/types';
import { shuffle } from '../lib/shuffle';

const ROUND_SIZE = 10;

function pickRound(bank: QuizBank, stage: 'all' | StageKey): QuizEntry[] {
  const pool: QuizEntry[] = [];
  for (const st of INDEX.ko.stages) {
    if (stage !== 'all' && st.key !== stage) continue;
    for (const tid of st.topics) {
      const b = bank[tid];
      b?.items.forEach((item, qi) => pool.push({ tid, qi, item, tag: `${tid} ${b.name}` }));
    }
  }
  return shuffle(pool).slice(0, ROUND_SIZE);
}

/** 한 판(10문제). 마운트될 때 한 번만 문제를 뽑아 고정해요. */
function Round({ bank, stage, onRestart }: { bank: QuizBank; stage: 'all' | StageKey; onRestart: () => void }) {
  const { t, base } = useLang();
  // 무작위 결과를 렌더링마다 다시 뽑으면 문제가 바뀌어 버리므로, useState 초기값으로 한 번만 계산
  const [items] = useState(() => pickRound(bank, stage));
  return (
    <QuizRunner
      items={items}
      onRestart={onRestart}
      resultActions={(score, n) =>
        score < n && (
          <Link className="cta ghost" to={`${base}/review`}>
            {t.toReview}
          </Link>
        )
      }
    />
  );
}

export default function RandomQuiz() {
  const bank = useLoaderData() as QuizBank;
  const [params, setParams] = useSearchParams();
  const stage = parseStage(params.get('stage'));
  const [round, setRound] = useState(0);
  const { lang, t } = useLang();
  useDocumentTitle(t.navRandom);

  return (
    <main className="wrap">
      <header className="hero compact">
        <div className="hero-top">
          <span className="eyebrow">{t.randomEyebrow}</span>
          <LangToggle />
        </div>
        <h1>{t.randomTitle}</h1>
        <p className="sub">{t.randomSub}</p>
      </header>
      <StageChips value={stage} onChange={(v) => setParams(v === 'all' ? {} : { stage: v }, { replace: true })} />
      <Round key={`${lang}-${stage}-${round}`} bank={bank} stage={stage} onRestart={() => setRound((r) => r + 1)} />
    </main>
  );
}
