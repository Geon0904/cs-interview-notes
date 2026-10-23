import { useState } from 'react';
import { Link, useLoaderData, useSearchParams } from 'react-router';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { QuizRunner, type QuizEntry } from '../components/QuizRunner';
import { StageChips } from '../components/StageChips';
import { INDEX, parseStage } from '../content/load';
import type { QuizBank, StageKey } from '../content/types';
import { shuffle } from '../lib/shuffle';

const ROUND_SIZE = 10;

function pickRound(bank: QuizBank, stage: 'all' | StageKey): QuizEntry[] {
  const pool: QuizEntry[] = [];
  for (const st of INDEX.stages) {
    if (stage !== 'all' && st.key !== stage) continue;
    for (const tid of st.topics) {
      const b = bank[tid];
      b?.items.forEach((item, qi) => pool.push({ tid, qi, item, tag: `${tid} ${b.ko}` }));
    }
  }
  return shuffle(pool).slice(0, ROUND_SIZE);
}

/** 한 판(10문제). 마운트될 때 한 번만 문제를 뽑아 고정해요. */
function Round({ bank, stage, onRestart }: { bank: QuizBank; stage: 'all' | StageKey; onRestart: () => void }) {
  // 무작위 결과를 렌더링마다 다시 뽑으면 문제가 바뀌어 버리므로, useState 초기값으로 한 번만 계산
  const [items] = useState(() => pickRound(bank, stage));
  return (
    <QuizRunner
      items={items}
      onRestart={onRestart}
      resultActions={(score, n) =>
        score < n && (
          <Link className="cta ghost" to="/review">
            오답 노트 보기
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
  useDocumentTitle('랜덤 퀴즈');

  return (
    <main className="wrap">
      <header className="hero compact">
        <span className="eyebrow">Random Quiz</span>
        <h1>섞어서 10문제</h1>
        <p className="sub">고른 단계의 확인 퀴즈에서 무작위로 뽑습니다.</p>
      </header>
      <StageChips value={stage} onChange={(v) => setParams(v === 'all' ? {} : { stage: v }, { replace: true })} />
      <Round key={`${stage}-${round}`} bank={bank} stage={stage} onRestart={() => setRound((r) => r + 1)} />
    </main>
  );
}
