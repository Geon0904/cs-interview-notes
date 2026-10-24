import { BlockView, Inline } from '../../components/Blocks';
import { Icon } from '../../components/Icon';
import type { Topic } from '../../content/types';
import { useLang } from '../../i18n/LangProvider';

/** 주제 전체를 관통하는 비유 소개 카드 (설명 탭 첫 섹션, 개념 정리 탭에서 재사용) */
export function TopicIntro({ topic }: { topic: Topic }) {
  const { t } = useLang();
  return (
    <section className="card" aria-label={t.topicIntro}>
      <span className="lbl">
        <Icon name="bulb" />
        {topic.analogy}
      </span>
      <p className="txt">
        <Inline text={topic.intro} />
      </p>
      {topic.introBlocks.map((b, i) => (
        <BlockView key={i} b={b} />
      ))}
    </section>
  );
}
