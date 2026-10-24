import { Link, useLocation } from 'react-router';
import { saveLang, switchLangPath, useLang } from '../i18n/LangProvider';
import { LANGS } from '../i18n/strings';

/**
 * KO / EN 전환. 언어를 바꾸면 "같은 화면의 다른 언어 주소"로 이동해요.
 * 화면 이동이라 링크(<a>)로 만들었고, 고른 언어는 이 브라우저에 기억해 둬요(다음에 '/'로 들어오면 그 언어로).
 * 진도는 두 언어가 같은 번호 체계를 쓰기 때문에 바꿔도 그대로 이어져요.
 */
export function LangToggle() {
  const { lang } = useLang();
  const { pathname, search } = useLocation();
  return (
    <nav className="lang" aria-label="Language · 언어">
      {LANGS.map((l) => (
        <Link
          key={l}
          to={switchLangPath(pathname, search, l)}
          replace
          lang={l}
          hrefLang={l}
          aria-current={l === lang ? 'true' : undefined}
          onClick={() => saveLang(l)}
        >
          {l.toUpperCase()}
        </Link>
      ))}
    </nav>
  );
}
