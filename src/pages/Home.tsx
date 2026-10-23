import { Link, useSearchParams } from 'react-router';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Inline } from '../components/Blocks';
import { Icon } from '../components/Icon';
import { StageChips } from '../components/StageChips';
import { INDEX, TOPIC_META, parseStage, stageOf } from '../content/load';
import type { TopicMeta } from '../content/types';
import { sectionDone, type Progress } from '../state/progress';
import { useProgress } from '../state/ProgressProvider';
import { prefetchTopic } from '../prefetch';
import { topicPath } from '../routes';

function topicStats(p: Progress, t: TopicMeta) {
  let ok = 0;
  let n = 0;
  t.sections.forEach((s, si) => {
    ok += sectionDone(p, t.id, si, s.cards);
    n += s.cards;
  });
  return { ok, n };
}

export default function Home() {
  const p = useProgress();
  // 필터를 주소(?stage=ai)에 두면 새로고침·공유해도 같은 화면이 나와요.
  const [params, setParams] = useSearchParams();
  const stage = parseStage(params.get('stage'));
  useDocumentTitle();

  const totals = INDEX.topics.reduce(
    (acc, t) => {
      const s = topicStats(p, t);
      return { ok: acc.ok + s.ok, n: acc.n + s.n, quiz: acc.quiz + (p.quiz[t.id] ? 1 : 0) };
    },
    { ok: 0, n: 0, quiz: 0 },
  );
  const wrong = Object.keys(p.wrong).length;

  const first = INDEX.topics[0]!;
  const last = p.last && TOPIC_META[p.last.tid] ? p.last : null;
  const lt = last ? TOPIC_META[last.tid]! : first;
  const lsec = last?.sec ?? 0;
  const ltab = last?.tab ?? (lt.hasLessons ? 'learn' : 'qa');

  return (
    <main className="wrap">
      <header className="hero">
        <span className="eyebrow">CS Interview</span>
        <h1>
          오늘은 무엇을
          <br />
          공부할까요?
        </h1>
        <p className="sub">
          {INDEX.topics.length}개 주제 · {INDEX.stages.length}단계 · 기초부터 AI까지
        </p>
      </header>

      <Link className="cont" to={topicPath(lt.id, ltab, lsec)} onPointerEnter={() => prefetchTopic(lt.id)} onFocus={() => prefetchTopic(lt.id)}>
        <span className="row">
          <span>{last ? '이어서 학습' : '여기서 시작'}</span>
          <span>{stageOf(lt.id).no}</span>
        </span>
        <span className="cont-body">
          <span className="t">
            {lt.id} {lt.ko}
          </span>
          <span className="s">
            {lsec + 1}. <Inline text={lt.sections[lsec]?.title ?? ''} />
          </span>
        </span>
        <span className="segs" aria-hidden="true">
          {lt.sections.map((s, si) => (
            <i key={si} className={sectionDone(p, lt.id, si, s.cards) === s.cards ? 'on' : ''} />
          ))}
        </span>
      </Link>

      <div className="stats">
        <div className="stat">
          <b>
            {totals.ok}
            <small>/{totals.n}</small>
          </b>
          <span>이해한 문답</span>
        </div>
        <div className="stat">
          <b>
            {totals.quiz}
            <small>/{INDEX.topics.length}</small>
          </b>
          <span>푼 퀴즈</span>
        </div>
        <div className="stat">
          <b className={wrong ? 'warn' : undefined}>{wrong}</b>
          <span>남은 오답</span>
        </div>
      </div>

      <StageChips value={stage} onChange={(v) => setParams(v === 'all' ? {} : { stage: v }, { replace: true })} />

      {INDEX.stages
        .filter((st) => stage === 'all' || st.key === stage)
        .map((st) => (
          <section className="stage" key={st.key} aria-labelledby={`stage-${st.key}`}>
            <div className="stage-h">
              <span className="no">{st.no}</span>
              <h2 className="nm" id={`stage-${st.key}`}>
                {st.name}
              </h2>
            </div>
            <ul className="tlist">
              {st.topics.map((id) => {
                const t = TOPIC_META[id]!;
                const s = topicStats(p, t);
                const pct = s.n ? Math.round((s.ok / s.n) * 100) : 0;
                const qb = p.quiz[id];
                return (
                  <li key={id}>
                    <Link
                      className="trow"
                      to={topicPath(id, t.hasLessons ? 'learn' : 'concept', 0)}
                      onPointerEnter={() => prefetchTopic(id)}
                      onFocus={() => prefetchTopic(id)}
                    >
                      <span className="badge">{id}</span>
                      <span className="mid">
                        <span className="nm">
                          {t.ko}
                          <span className="en">{t.en}</span>
                        </span>
                        <span className="ds">
                          <Inline text={t.desc} />
                        </span>
                        <span className="bar" role="img" aria-label={`이해한 문답 ${s.ok}/${s.n}`}>
                          <i style={{ width: `${pct}%` }} />
                        </span>
                      </span>
                      <span className={`tcount${qb ? ' on' : ''}`}>{qb ? `${qb.best}/${qb.n}` : `${s.n}문항`}</span>
                      <Icon name="chev" className="chev" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

      <p className="note">연습용이라 기록은 저장하지 않아요. 페이지를 닫거나 새로고침하면 처음부터 시작합니다.</p>
    </main>
  );
}
