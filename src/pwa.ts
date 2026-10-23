import { registerSW } from 'virtual:pwa-register';

/**
 * Service Worker 등록 (PWA).
 * Service Worker는 브라우저와 네트워크 사이에 끼어 있는 작은 스크립트예요.
 * 처음 방문할 때 앱 파일을 캐시에 받아 두고, 다음부터는 네트워크 없이도 캐시에서 앱을 열어 줍니다.
 *
 * registerType: 'autoUpdate'(vite.config.ts)라서 새 버전을 배포하면 다음 방문 때 자동으로 바뀌어요.
 * 개발 서버(npm run dev)에서는 캐시 때문에 헷갈리지 않도록 등록하지 않습니다.
 */
export function registerServiceWorker() {
  if (import.meta.env.DEV || !('serviceWorker' in navigator)) return;
  registerSW({ immediate: true });
}
