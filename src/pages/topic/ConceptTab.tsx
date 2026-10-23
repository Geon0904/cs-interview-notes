import { Link } from 'react-router';
import { BlockView, Inline, Table } from '../../components/Blocks';
import { Icon } from '../../components/Icon';
import type { Topic } from '../../content/types';
import { topicPath } from '../../routes';
import { sectionDone } from '../../state/progress';
import { useProgress } from '../../state/ProgressProvider';
import { TopicIntro } from './TopicIntro';

/** 개념 정리 탭: 주제를 한 장에 요약 (한 줄 답, 학습 순서, 표, 꼭 기억할 것) */
export function ConceptTab({ topic }: { topic: Topic }) {
  const p = useProgress();
  const hasLessons = topic.sections.some((s) => s.lessons.length > 0);

  // 카드 곳곳의 '기억할 것(M:)'만 모아 한 번에 복습
  const mems = topic.sections.flatMap((s, si) =>
    s.cards.flatMap((c) => c.blocks.flatMap((b) => (b.t === 'mem' ? [{ si, text: b.text }] : []))),
  );
  const tables = topic.sections.flatMap((s, si) =>
    s.intro.flatMap((b) => (b.t === 'table' ? [{ si, b, pre: s.intro.filter((x) => x.t === 'p') }] : [])),
  );

  const firstUnread = topic.sections.findIndex((_, i) => !p.read[`${topic.id}:${i}`]);
  const firstUndone = topic.sections.findIndex((s, i) => sectionDone(p, topic.id, i, s.cards.length) < s.cards.length);

  return (
    <>
      <TopicIntro topic={topic} />

      <section className="card neon" aria-label="한 줄 면접 답">
        <span className="lbl mono">한 줄 면접 답</span>
        <p className="txt">
          <Inline text={topic.one} />
        </p>
      </section>

      <section className="group">
        <h2 className="h2">학습 순서</h2>
        <div className="secs">
          {topic.sections.map((s, si) => {
            const ok = sectionDone(p, topic.id, si, s.cards.length);
            const n = s.cards.length;
            return (
              <Link key={si} to={topicPath(topic.id, hasLessons ? 'learn' : 'qa', si)}>
                <span className="n">{si + 1}</span>
                <span className="nm">
                  <Inline text={s.title} />
                </span>
                <span className={`st${ok === n ? ' done' : ''}`}>{ok === n ? '완료' : ok ? `${ok}/${n}` : `${n}문항`}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {tables.length > 0 && (
        <section className="group">
          <h2 className="h2">한눈에 보는 표</h2>
          {tables.map((x, i) => (
            <div className="group" key={i}>
              {x.pre.map((b, j) => (
                <BlockView key={j} b={b} />
              ))}
              {x.b.t === 'table' && <Table head={x.b.head} rows={x.b.rows} />}
            </div>
          ))}
        </section>
      )}

      {mems.length > 0 && (
        <section className="group">
          <h2 className="h2">꼭 기억할 것</h2>
          <ul className="memlist">
            {mems.map((m, i) => (
              <li className="m" key={i}>
                <small>
                  {m.si + 1}. <Inline text={topic.sections[m.si]!.title} />
                </small>
                <p>
                  <Inline text={m.text} />
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasLessons && (
        <Link className="cta" to={topicPath(topic.id, 'learn', Math.max(0, firstUnread))}>
          설명부터 읽기 <Icon name="arrow" />
        </Link>
      )}
      <Link className={`cta${hasLessons ? ' ghost' : ''}`} to={topicPath(topic.id, 'qa', Math.max(0, firstUndone))}>
        문답으로 공부하기 <Icon name="arrow" />
      </Link>
    </>
  );
}
