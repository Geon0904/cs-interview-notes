import { useState } from 'react';
import { Link } from 'react-router';
import { QuizRunner } from '../../components/QuizRunner';
import type { Topic } from '../../content/types';
import { topicPath } from '../../routes';
import { useProgressDispatch } from '../../state/ProgressProvider';

/** 주제 확인 퀴즈. 문제 순서는 콘텐츠 순서 그대로예요(정답 위치는 콘텐츠에서 미리 고르게 섞어 둠). */
export function QuizTab({ topic, sec }: { topic: Topic; sec: number }) {
  const dispatch = useProgressDispatch();
  // round가 바뀌면 key가 바뀌어 QuizRunner가 새로 만들어져요 → '다시 풀기'
  const [round, setRound] = useState(0);
  const items = topic.quiz.map((item, qi) => ({ tid: topic.id, qi, item }));

  return (
    <QuizRunner
      key={round}
      items={items}
      onFinish={(score, n) => dispatch({ type: 'quiz/finish', tid: topic.id, score, n })}
      onRestart={() => setRound((r) => r + 1)}
      resultActions={(score, n) => (
        <>
          {score < n && (
            <Link className="cta ghost" to="/review">
              오답 노트 보기
            </Link>
          )}
          <Link className="cta ghost" to={topicPath(topic.id, 'qa', sec)}>
            문답으로 돌아가기
          </Link>
        </>
      )}
    />
  );
}
