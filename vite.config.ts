import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // index.html에 manifest 링크를 자동으로 넣어 줘요.
      manifest: {
        name: 'CS 인터뷰 노트',
        short_name: 'CS 노트',
        description: 'CS 기초 16개 주제를 일상 비유와 단계별 설명으로 쉽게 배우는 면접 준비 앱',
        lang: 'ko',
        start_url: '/',
        display: 'standalone',
        background_color: '#0A0B0A',
        theme_color: '#0A0B0A',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // 앱 코드와 콘텐츠(주제별 JS 조각)는 설치할 때 미리 캐시(Precache) → 비행기 모드에서도 전체 동작
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        // SPA라서 /topic/07/learn 같은 주소도 오프라인에서 index.html로 열어 줘요.
        navigateFallback: '/index.html',
        // 한글 글꼴 조각은 수백 개라 미리 받지 않고, 실제로 쓰인 조각만 처음 쓸 때 캐시(Runtime Cache)
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'font',
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  build: {
    // 한글 글꼴 woff 대체 파일 등은 쓰이지 않으면 내려받지 않으므로, 경고 기준만 약간 올려요.
    chunkSizeWarningLimit: 600,
  },
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
    environment: 'node',
  },
});
