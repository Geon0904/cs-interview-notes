import { useEffect } from 'react';

const APP = 'CS 인터뷰 노트';

/** 브라우저 탭 제목을 화면에 맞게 바꿔요. 탭 여러 개를 띄워도, 스크린 리더로 들어와도 어느 화면인지 알 수 있게. */
export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${APP}` : APP;
  }, [title]);
}
