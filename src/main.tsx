import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import notoSansKr from '@fontsource-variable/noto-sans-kr/index.css?url';
import jetbrainsMono from '@fontsource-variable/jetbrains-mono/index.css?url';
import './styles/global.css';

import App from './App';
import { registerServiceWorker } from './pwa';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

registerServiceWorker();

/**
 * 글꼴은 앱과 함께 배포(Self-Hosting)하고, 렌더링을 막지 않도록 따로 불러와요.
 * - Self-Hosting: Google Fonts 같은 외부 서버 없이도(오프라인 PWA 포함) 같은 글꼴이 나오고, 사용자 정보가 밖으로 나가지 않아요.
 * - 가변 글꼴(Variable Font): 굵기 400~900을 파일 한 벌로 표현해요.
 * - unicode-range 분할: 한글 글꼴이 글자 범위별로 잘게 나뉘어 있어, 화면에 실제로 쓰인 글자 묶음만 내려받아요.
 * - 비동기 로드: 글꼴 CSS(약 88KB, 대부분 @font-face 선언)를 기본 CSS에 합치면 첫 화면이 그만큼 늦게 그려져요.
 *   JS로 <link>를 나중에 붙이면 렌더링을 막지 않고, 글꼴이 준비되면 바뀌어요(font-display: swap).
 *   측정(Lighthouse 모바일, 3회 중앙값): 홈 Performance 86 → 97.
 */
for (const href of [notoSansKr, jetbrainsMono]) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.append(link);
}
