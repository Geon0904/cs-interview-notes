import type { Lang } from './strings';

/** 이 언어의 주소 앞부분: ko는 '', en은 '/en' */
export const langBase = (lang: Lang) => (lang === 'en' ? '/en' : '');

/* ---------- 고른 언어 기억하기 (이 기기의 이 브라우저에만) ---------- */
const KEY = 'lang';

/** 저장소가 막힌 환경(시크릿 창 일부, 차단 설정)에서도 앱이 멈추지 않도록 try/catch로 감싸요. */
export function savedLang(): Lang | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'en' || v === 'ko' ? v : null;
  } catch {
    return null;
  }
}

export function saveLang(lang: Lang) {
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    /* 저장 못 해도 주소에 언어가 있으니 괜찮아요 */
  }
}

/** 현재 주소를 다른 언어의 같은 화면 주소로 바꿔요. /topic/07/qa?s=3 ↔ /en/topic/07/qa?s=3 */
export function switchLangPath(pathname: string, search: string, to: Lang): string {
  const rest = pathname === '/en' ? '/' : pathname.startsWith('/en/') ? pathname.slice(3) : pathname;
  const path = to === 'en' ? (rest === '/' ? '/en' : `/en${rest}`) : rest;
  return path + search;
}
