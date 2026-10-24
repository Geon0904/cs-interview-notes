import { createContext, use, useEffect, useMemo, type ReactNode } from 'react';
import { langBase } from './lang';
import { STRINGS, type Lang, type Strings } from './strings';

export { saveLang, savedLang, switchLangPath } from './lang';

/**
 * 현재 언어를 화면 전체에 알려 주는 Context.
 *
 * 언어의 "진짜 출처"는 주소(URL)예요. `/topic/07/learn`은 한국어, `/en/topic/07/learn`은 영어.
 * 그래서 링크를 공유하면 받은 사람도 같은 언어로 보고, 새로고침해도 언어가 유지돼요.
 * 라우터가 주소에 맞는 lang으로 이 Provider를 감싸 주고(App.tsx), 화면은 useLang()으로 읽기만 해요.
 */
interface LangValue {
  lang: Lang;
  t: Strings;
  /** 이 언어의 주소 앞부분: ko는 '', en은 '/en' */
  base: string;
}

const LangContext = createContext<LangValue | null>(null);

export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  // <html lang>을 맞춰 두면 화면 낭독기가 올바른 발음 규칙으로 읽고, 브라우저 번역 제안도 정확해져요.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  // 매 렌더마다 새 객체를 만들면 언어가 그대로여도 이 Context를 읽는 모든 화면이 다시 그려져요.
  const value = useMemo(() => ({ lang, t: STRINGS[lang], base: langBase(lang) }), [lang]);
  return <LangContext value={value}>{children}</LangContext>;
}

export function useLang(): LangValue {
  const v = use(LangContext);
  if (!v) throw new Error('useLang은 <LangProvider> 안에서만 쓸 수 있어요');
  return v;
}
