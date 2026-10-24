import { Link, useSearchParams } from 'react-router';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Inline } from '../components/Blocks';
import { Icon } from '../components/Icon';
import { LangToggle } from '../components/LangToggle';
import { StageChips } from '../components/StageChips';
import { INDEX, TOPIC_META, parseStage, stageKeyOf, topicName } from '../content/load';
import type { TopicMeta } from '../content/types';
import { useLang } from '../i18n/LangProvider';
import { STAGE_NAMES } from '../i18n/strings';
import { prefetchTopic } from '../prefetch';
import { topicPath } from '../routes';
import { sectionDone, type Progress } from '../state/progress';
import { useProgress } from '../state/ProgressProvider';

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
  const { lang, t, base } = useLang();
  const index = INDEX[lang];
  const meta = TOPIC_META[lang];
  // 필터를 주소(?stage=ai)에 두면 새로고침·공유해도 같은 화면이 나와요.
  const [params, setParams] = useSearchParams();
  const stage = parseStage(params.get('stage'));
  useDocumentTitle();

  const totals = index.topics.reduce(
    (acc, tm) => {
      const s = topicStats(p, tm);
      return { ok: acc.ok + s.ok, n: acc.n + s.n, quiz: acc.quiz + (p.quiz[tm.id] ? 1 : 0) };
    },
    { ok: 0, n: 0, quiz: 0 },
  );
  const wrong = Object.keys(p.wrong).length;

  const first = index.topics[0]!;
  const last = p.last && meta[p.last.tid] ? p.last : null;
  const lt = last ? meta[last.tid]! : first;
  const lsec = last?.sec ?? 0;
  const ltab = last?.tab ?? (lt.hasLessons ? 'learn' : 'qa');

  return (
    <main className="wrap">
      <header className="hero">
        <div className="hero-top">
          <span className="eyebrow">{t.homeEyebrow}</span>
          <LangToggle />
        </div>
        <h1>
          {t.homeTitle1}
          <br />
          {t.homeTitle2}
        </h1>
        <p className="sub">{t.homeSub(index.topics.length, index.stages.length)}</p>
      </header>

      <Link
        className="cont"
        to={topicPath(base, lt.id, ltab, lsec)}
        onPointerEnter={() => prefetchTopic(lang, lt.id)}
        onFocus={() => prefetchTopic(lang, lt.id)}
      >
        <span className="row">
          <span>{last ? t.continueStudy : t.startHere}</span>
          <span>{STAGE_NAMES[lang][stageKeyOf(lt.id)].no}</span>
        </span>
        <span className="cont-body">
          <span className="t">
            {lt.id} {topicName(lt, lang)}
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
          <span>{t.statCards}</span>
        </div>
        <div className="stat">
          <b>
            {totals.quiz}
            <small>/{index.topics.length}</small>
          </b>
          <span>{t.statQuiz}</span>
        </div>
        <div className="stat">
          <b className={wrong ? 'warn' : undefined}>{wrong}</b>
          <span>{t.statWrong}</span>
        </div>
      </div>

      <StageChips value={stage} onChange={(v) => setParams(v === 'all' ? {} : { stage: v }, { replace: true })} />

      {index.stages
        .filter((st) => stage === 'all' || st.key === stage)
        .map((st) => (
          <section className="stage" key={st.key} aria-labelledby={`stage-${st.key}`}>
            <div className="stage-h">
              <span className="no">{STAGE_NAMES[lang][st.key].no}</span>
              <h2 className="nm" id={`stage-${st.key}`}>
                {STAGE_NAMES[lang][st.key].name}
              </h2>
            </div>
            <ul className="tlist">
              {st.topics.map((id) => {
                const tm = meta[id]!;
                const s = topicStats(p, tm);
                const pct = s.n ? Math.round((s.ok / s.n) * 100) : 0;
                const qb = p.quiz[id];
                return (
                  <li key={id}>
                    <Link
                      className="trow"
                      to={topicPath(base, id, tm.hasLessons ? 'learn' : 'concept', 0)}
                      onPointerEnter={() => prefetchTopic(lang, id)}
                      onFocus={() => prefetchTopic(lang, id)}
                    >
                      <span className="badge">{id}</span>
                      <span className="mid">
                        <span className="nm">
                          {topicName(tm, lang)}
                          {lang === 'ko' && <span className="en">{tm.en}</span>}
                        </span>
                        <span className="ds">
                          <Inline text={tm.desc} />
                        </span>
                        <span className="bar" role="img" aria-label={t.cardsUnderstood(s.ok, s.n)}>
                          <i style={{ width: `${pct}%` }} />
                        </span>
                      </span>
                      <span className={`tcount${qb ? ' on' : ''}`}>{qb ? `${qb.best}/${qb.n}` : t.questionsCount(s.n)}</span>
                      <Icon name="chev" className="chev" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

      <p className="note">{t.noSaveNote}</p>
    </main>
  );
}
