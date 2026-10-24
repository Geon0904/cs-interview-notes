import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { BlockView, Inline } from '../../components/Blocks';
import { Icon } from '../../components/Icon';
import { SectionPicker } from '../../components/SectionPicker';
import type { Topic } from '../../content/types';
import { useLang } from '../../i18n/LangProvider';
import { topicPath } from '../../routes';
import { cardKey, firstOpenCard, nextOpenCard, progressReducer, sectionDone, type ProgressAction } from '../../state/progress';
import { useProgress, useProgressDispatch } from '../../state/ProgressProvider';

/**
 * 문답 탭: 질문 카드를 하나씩 펼쳐 보고 '이해했어요 / 다시 볼래요'로 표시해요.
 * '이해했어요'를 누르면 아직 이해하지 못한 다음 카드가 자동으로 펼쳐져서 손이 덜 가요.
 */
export function QaTab({ topic, sec }: { topic: Topic; sec: number }) {
  const p = useProgress();
  const dispatch = useProgressDispatch();
  const { t, base } = useLang();
  const s = topic.sections[sec]!;
  const n = s.cards.length;

  // 처음 펼칠 카드: 아직 이해하지 못한 첫 카드 (useState의 초기값 함수는 첫 렌더에서만 실행)
  const [open, setOpen] = useState(() => firstOpenCard(p, topic.id, sec, n));

  // 카드를 바꾼 "다음" 렌더가 끝난 뒤 그 카드로 스크롤해야 해서, 목표를 ref에 적어 두고 effect에서 처리해요.
  // (state로 두면 스크롤 후 다시 렌더링이 한 번 더 일어나요.)
  const scrollTarget = useRef<number | null>(null);
  useEffect(() => {
    if (scrollTarget.current === null) return;
    document.getElementById(`card-${scrollTarget.current}`)?.scrollIntoView({ block: 'start' });
    scrollTarget.current = null;
  });

  const toggle = (ci: number) => {
    setOpen(open === ci ? -1 : ci);
    scrollTarget.current = ci;
  };

  const got = (ci: number) => {
    const action: ProgressAction = { type: 'card/mark', key: cardKey(topic.id, sec, ci), mark: 'ok' };
    dispatch(action);
    // dispatch 결과는 다음 렌더에서야 보이므로, 같은 Reducer로 "다음 상태"를 미리 계산해서 다음 카드를 찾아요.
    const nx = nextOpenCard(progressReducer(p, action), topic.id, sec, n, ci);
    setOpen(nx);
    scrollTarget.current = nx >= 0 ? nx : ci;
  };

  const done = sectionDone(p, topic.id, sec, n);
  const hasNext = sec + 1 < topic.sections.length;

  return (
    <>
      <SectionPicker
        titles={topic.sections.map((x) => x.title)}
        current={sec}
        hrefFor={(i) => topicPath(base, topic.id, 'qa', i)}
        done={(i) => sectionDone(p, topic.id, i, topic.sections[i]!.cards.length) === topic.sections[i]!.cards.length}
      />

      <div className="sechead">
        <h2>
          {sec + 1}. <Inline text={s.title} />
        </h2>
        <span>{t.understoodCount(done, n)}</span>
      </div>

      {s.intro.length > 0 && (
        <div className="card tight">
          {s.intro.map((b, i) => (
            <BlockView key={i} b={b} />
          ))}
        </div>
      )}

      {s.cards.map((c, ci) => {
        const st = p.cards[cardKey(topic.id, sec, ci)] ?? 'none';
        const isOpen = open === ci;
        return (
          <article className={`qcard${st === 'ok' ? ' ok' : ''}`} id={`card-${ci}`} key={ci}>
            <h3 className="qh">
              <button type="button" className="qhead" aria-expanded={isOpen} aria-controls={`card-${ci}-body`} onClick={() => toggle(ci)}>
                <span className="qn">Q{ci + 1}</span>
                <span className="qq">
                  <Inline text={c.q} />
                </span>
                <span className={`dot ${st}`} role="img" aria-label={t.dot[st]} />
                <span className="ic" aria-hidden="true">
                  {isOpen ? '−' : '+'}
                </span>
              </button>
            </h3>
            {isOpen && (
              <div className="qbody" id={`card-${ci}-body`}>
                {c.blocks.map((b, i) => (
                  <BlockView key={i} b={b} />
                ))}
                <div className="acts">
                  <button
                    type="button"
                    className="again"
                    aria-pressed={st === 'again'}
                    onClick={() => dispatch({ type: 'card/toggleAgain', key: cardKey(topic.id, sec, ci) })}
                  >
                    {t.again}
                  </button>
                  <button type="button" className="got" aria-pressed={st === 'ok'} onClick={() => got(ci)}>
                    {t.gotIt}
                  </button>
                </div>
              </div>
            )}
          </article>
        );
      })}

      {hasNext && (
        <Link className="cta" to={topicPath(base, topic.id, 'qa', sec + 1)}>
          {t.nextSection} {sec + 2}. <Inline text={topic.sections[sec + 1]!.title} /> <Icon name="arrow" />
        </Link>
      )}
      <Link className={`cta${hasNext ? ' ghost' : ''}`} to={topicPath(base, topic.id, 'quiz', sec)}>
        {t.takeQuiz} <Icon name="arrow" />
      </Link>
    </>
  );
}
