import { Link } from 'react-router';
import { FieldView, Inline } from '../../components/Blocks';
import { Icon } from '../../components/Icon';
import { SectionPicker } from '../../components/SectionPicker';
import type { Topic } from '../../content/types';
import { topicPath } from '../../routes';
import { useProgress, useProgressDispatch } from '../../state/ProgressProvider';
import { TopicIntro } from './TopicIntro';

/** 사용자가 '움직임 줄이기'를 켜 두었으면 부드러운 스크롤 대신 바로 이동 (접근성) */
const scrollBehavior = (): ScrollBehavior =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

/** 설명 탭: 한 섹션의 설명(Lesson)들을 순서대로 보여 줘요. */
export function LearnTab({ topic, sec }: { topic: Topic; sec: number }) {
  const p = useProgress();
  const dispatch = useProgressDispatch();
  const s = topic.sections[sec]!;
  const lessons = s.lessons;
  const hasNext = sec + 1 < topic.sections.length;
  const markRead = () => dispatch({ type: 'lesson/read', tid: topic.id, sec });

  return (
    <>
      <SectionPicker
        titles={topic.sections.map((x) => x.title)}
        current={sec}
        hrefFor={(i) => topicPath(topic.id, 'learn', i)}
        done={(i) => !!p.read[`${topic.id}:${i}`]}
      />

      {sec === 0 && <TopicIntro topic={topic} />}

      <div className="sechead">
        <h2>
          {sec + 1}. <Inline text={s.title} />
        </h2>
        <span>개념 {lessons.length}개</span>
      </div>

      {lessons.length === 0 ? (
        <div className="empty">
          <b>이 섹션은 아직 설명을 준비 중이에요</b>
          <span>문답에서 먼저 공부할 수 있어요.</span>
        </div>
      ) : (
        <>
          {lessons.length > 1 && (
            <nav className="toc" aria-label="이 섹션에서 배울 것">
              {lessons.map((l, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => document.getElementById(`lesson-${i}`)?.scrollIntoView({ block: 'start', behavior: scrollBehavior() })}
                >
                  <span className="n">
                    {sec + 1}-{i + 1}
                  </span>
                  <span>
                    <Inline text={l.title} />
                  </span>
                </button>
              ))}
            </nav>
          )}
          {lessons.map((l, i) => (
            <article className="lesson" id={`lesson-${i}`} key={i} aria-labelledby={`lesson-${i}-h`}>
              <div className="lhd">
                <span className="lno">
                  {sec + 1}-{i + 1}
                </span>
                <h3 id={`lesson-${i}-h`}>
                  <Inline text={l.title} />
                </h3>
              </div>
              {l.fields.map((f, j) => (
                <FieldView key={j} f={f} />
              ))}
            </article>
          ))}
        </>
      )}

      <Link className="cta" to={topicPath(topic.id, 'qa', sec)} onClick={markRead}>
        이해했어요 · 문답으로 확인 <Icon name="arrow" />
      </Link>
      {hasNext ? (
        <Link className="cta ghost" to={topicPath(topic.id, 'learn', sec + 1)} onClick={markRead}>
          다음 설명: {sec + 2}. <Inline text={topic.sections[sec + 1]!.title} />
        </Link>
      ) : (
        <Link className="cta ghost" to={topicPath(topic.id, 'quiz', sec)} onClick={markRead}>
          확인 퀴즈 풀기 <Icon name="arrow" />
        </Link>
      )}
    </>
  );
}
