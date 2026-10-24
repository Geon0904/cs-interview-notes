import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router';
import { useLang } from '../i18n/LangProvider';
import { Inline } from './Blocks';

interface Props {
  titles: string[];
  current: number;
  /** 섹션 번호(0부터) → 이동할 주소 */
  hrefFor: (sec: number) => string;
  /** 섹션 옆에 ✓를 보여 줄지 */
  done: (sec: number) => boolean;
}

/** 가로로 스크롤되는 섹션 선택 줄. 현재 섹션이 화면 안에 보이도록 스크롤 위치를 맞춰요. */
export function SectionPicker({ titles, current, hrefFor, done }: Props) {
  const { t } = useLang();
  const box = useRef<HTMLElement>(null);

  // useLayoutEffect: 화면에 그려지기 "직전"에 실행돼서, 스크롤이 튀는 모습이 보이지 않아요.
  useLayoutEffect(() => {
    const el = box.current?.querySelector<HTMLElement>('[aria-current="true"]');
    if (el && box.current) box.current.scrollLeft = Math.max(0, el.offsetLeft - box.current.offsetLeft - 24);
  }, [current]);

  return (
    <nav className="secpick" ref={box} aria-label={t.sectionPicker}>
      {titles.map((title, i) => (
        <Link key={i} to={hrefFor(i)} replace aria-current={i === current ? 'true' : undefined}>
          {i + 1}. <Inline text={title} />
          {done(i) && (
            <span className="ok" aria-label={t.done}>
              ✓
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
