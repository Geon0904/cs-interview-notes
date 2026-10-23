import { NavLink } from 'react-router';
import { useProgress } from '../state/ProgressProvider';
import { Icon } from './Icon';

/**
 * 하단 메뉴. 화면 전환이므로 <button>이 아니라 링크(NavLink)로 만들었어요.
 * 링크는 주소가 바뀌고, 새 탭으로 열 수 있고, 스크린 리더가 '링크'로 읽어 줘요.
 * NavLink는 현재 주소와 일치하면 aria-current="page"를 자동으로 붙여 줍니다.
 */
export function BottomNav() {
  const wrong = Object.keys(useProgress().wrong).length;
  return (
    <nav className="nav" aria-label="메뉴">
      <div className="in">
        <NavLink to="/" end>
          <Icon name="grid" size={22} />
          주제
        </NavLink>
        <NavLink to="/random">
          <Icon name="dice" size={22} />
          랜덤 퀴즈
        </NavLink>
        <NavLink to="/review">
          <Icon name="note" size={22} />
          <span>
            오답 노트
            {wrong > 0 && (
              <span className="cnt" aria-label={`${wrong}개`}>
                {wrong}
              </span>
            )}
          </span>
        </NavLink>
      </div>
    </nav>
  );
}
