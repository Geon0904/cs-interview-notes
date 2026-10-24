import { useEffect, type CSSProperties } from 'react';
import { Link, Navigate, NavLink, useLoaderData, useParams, useSearchParams } from 'react-router';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Icon } from '../components/Icon';
import { LangToggle } from '../components/LangToggle';
import { stageKeyOf, topicName } from '../content/load';
import type { Topic } from '../content/types';
import { useLang } from '../i18n/LangProvider';
import { STAGE_NAMES } from '../i18n/strings';
import { isTopicTab, parseSection, TOPIC_TABS, topicPath } from '../routes';
import { useProgressDispatch } from '../state/ProgressProvider';
import { ConceptTab } from './topic/ConceptTab';
import { LearnTab } from './topic/LearnTab';
import { QaTab } from './topic/QaTab';
import { QuizTab } from './topic/QuizTab';

/**
 * 주제 화면. 본문 데이터는 라우터의 loader가 화면을 그리기 전에 미리 불러 둡니다(App.tsx 참고).
 * 그래서 이 컴포넌트 안에는 "로딩 중" 분기가 없고, 항상 데이터가 있는 상태로 시작해요.
 */
export default function TopicPage() {
  const topic = useLoaderData() as Topic;
  const { tab } = useParams();
  const [params] = useSearchParams();
  const dispatch = useProgressDispatch();
  const { lang, t, base } = useLang();
  const hasLessons = topic.sections.some((s) => s.lessons.length > 0);
  const sec = parseSection(params.get('s'), topic.sections.length);
  const validTab = isTopicTab(tab) && (tab !== 'learn' || hasLessons);
  useDocumentTitle(topicName(topic, lang));

  // 설명·문답을 보고 있으면 '이어서 학습' 위치로 기억해요.
  // 화면 그리기와 상관없는 "부수 효과"라서 렌더링 중이 아니라 useEffect에서 처리합니다.
  useEffect(() => {
    if (validTab) dispatch({ type: 'visit', tid: topic.id, sec, tab: tab === 'learn' || tab === 'qa' ? tab : null });
  }, [dispatch, topic.id, sec, tab, validTab]);

  if (!validTab) return <Navigate to={topicPath(base, topic.id, hasLessons ? 'learn' : 'concept', sec)} replace />;

  const st = STAGE_NAMES[lang][stageKeyOf(topic.id)];
  const tabs = TOPIC_TABS.filter((k) => k !== 'learn' || hasLessons);

  return (
    <main className="wrap">
      <header className="thead">
        <div className="top">
          <Link className="back" to={base || '/'} aria-label={t.backToTopics}>
            <Icon name="back" size={20} />
          </Link>
          <div className="tt">
            <span className="eyebrow">
              {/* 한국어판은 영어 이름을 함께 보여 줘요(용어를 영어로 익히도록). 영어판에 한글을 섞으면 읽기만 방해해서 빼요. */}
              {st.no} · {topic.id}
              {lang === 'ko' && ` · ${topic.en}`}
            </span>
            <h1>{topicName(topic, lang)}</h1>
          </div>
          <LangToggle />
        </div>
        {/* 탭마다 주소가 다른 '화면 이동'이라 role="tab" 대신 링크 + aria-current로 만들었어요. */}
        <nav className="seg" aria-label={t.studyModes} style={{ '--tabs': tabs.length } as CSSProperties}>
          {tabs.map((k) => (
            <NavLink key={k} to={topicPath(base, topic.id, k, sec)} replace>
              {t.tabs[k]}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* key: 주제·섹션이 바뀌면 탭 컴포넌트를 새로 만들어 내부 상태(열린 카드, 퀴즈 진행)를 초기화 */}
      {tab === 'learn' && <LearnTab key={`${lang}-${topic.id}-${sec}`} topic={topic} sec={sec} />}
      {tab === 'concept' && <ConceptTab topic={topic} />}
      {tab === 'qa' && <QaTab key={`${lang}-${topic.id}-${sec}`} topic={topic} sec={sec} />}
      {tab === 'quiz' && <QuizTab key={`${lang}-${topic.id}`} topic={topic} sec={sec} />}
    </main>
  );
}
