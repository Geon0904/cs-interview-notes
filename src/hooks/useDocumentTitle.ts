import { useEffect } from 'react';
import { useLang } from '../i18n/LangProvider';

/** 브라우저 탭 제목을 화면에 맞게 바꿔요. 탭 여러 개를 띄워도, 스크린 리더로 들어와도 어느 화면인지 알 수 있게. */
export function useDocumentTitle(title?: string) {
  const { t } = useLang();
  useEffect(() => {
    document.title = title ? `${title} · ${t.appName}` : t.appName;
  }, [title, t.appName]);
}
