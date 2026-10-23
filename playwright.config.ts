import { defineConfig, devices } from '@playwright/test';

/**
 * E2E(End-to-End) 테스트: 실제 브라우저로 빌드된 앱을 열어 사용자처럼 클릭해 봐요.
 * CI에서는 `npx playwright install chromium`으로 받은 브라우저를 쓰고,
 * 브라우저가 미리 설치된 환경에서는 PW_CHROMIUM_PATH로 그 경로를 지정할 수 있어요.
 */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  projects: [
    // 이 앱은 휴대폰 화면이 기본이라 모바일 크기로 테스트해요.
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
});
