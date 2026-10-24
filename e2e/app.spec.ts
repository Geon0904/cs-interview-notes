import { expect, test, type Page } from '@playwright/test';

/** 영어판 화면에 한글이 섞여 있으면 실패 (언어 버튼의 aria-label "Language · 언어"처럼 화면에 안 보이는 속성은 제외) */
async function expectNoHangul(page: Page) {
  const text = await page.evaluate(() => `${document.title}\n${document.body.innerText}`);
  expect(text.match(/\S*[\uac00-\ud7a3]\S*/g)).toBeNull();
}

/** 가로 스크롤이 생기면(레이아웃이 화면 밖으로 넘치면) 실패 */
async function expectNoHorizontalOverflow(page: Page) {
  const { scroll, client } = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(scroll).toBeLessThanOrEqual(client);
}

test('홈: 16개 주제와 단계 필터', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('오늘은 무엇을');
  await expect(page.locator('.trow')).toHaveCount(16);

  await page.getByRole('button', { name: 'AI', exact: true }).click();
  await expect(page).toHaveURL(/\?stage=ai$/);
  await expect(page.locator('.trow')).toHaveCount(5);
  await expectNoHorizontalOverflow(page);
});

test('주제: 설명 → 문답 → 이해했어요 → 진도 반영', async ({ page }) => {
  await page.goto('/');
  await page.locator('.trow', { hasText: '이산수학' }).click();
  await expect(page).toHaveURL(/\/topic\/01\/learn$/);
  await expect(page).toHaveTitle(/이산수학/);
  await expect(page.locator('article.lesson').first()).toBeVisible();

  // 설명을 읽고 문답으로 이동하면 첫 카드가 펼쳐져 있어요.
  await page.getByRole('link', { name: /이해했어요 · 문답으로 확인/ }).click();
  await expect(page).toHaveURL(/\/topic\/01\/qa$/);
  const first = page.locator('#card-0');
  await expect(first.getByRole('button', { expanded: true })).toBeVisible();

  await first.getByRole('button', { name: '이해했어요' }).click();
  // 다음 카드가 자동으로 펼쳐지고, 섹션 진도가 1로 올라가요.
  await expect(page.locator('#card-1').getByRole('button', { expanded: true })).toBeVisible();
  await expect(page.locator('.sechead span')).toContainText('1/');

  // 홈으로 돌아가면 '이어서 학습'과 통계에 반영돼요.
  await page.getByRole('link', { name: '주제 목록으로' }).click();
  await expect(page.locator('.cont')).toContainText('이어서 학습');
  await expect(page.locator('.stat').first()).toContainText('1/');
});

test('기록은 저장하지 않아요: 새로고침하면 처음부터', async ({ page }) => {
  await page.goto('/topic/02/quiz');
  // 02번 퀴즈 1번의 정답은 C → 일부러 A를 골라 틀려요.
  await page.locator('.opt').nth(0).click();
  await page.getByRole('button', { name: '정답 확인' }).click();
  await expect(page.locator('.fb.wrong')).toContainText('정답은 C');

  // page.goto는 전체 새로고침이라 메모리에 있던 진도가 사라져요.
  await page.goto('/review');
  await expect(page.getByText('아직 오답이 없어요')).toBeVisible();
});

test('퀴즈 → 오답 노트 (앱 안에서 이동)', async ({ page }) => {
  await page.goto('/topic/02/quiz');
  await page.locator('.opt').nth(0).click();
  await page.getByRole('button', { name: '정답 확인' }).click();

  await page.getByRole('link', { name: '주제 목록으로' }).click();
  await expect(page.locator('.nav .cnt')).toHaveText('1');
  await page.getByRole('link', { name: /오답 노트/ }).click();
  await expect(page.locator('.wcard')).toHaveCount(1);

  await page.getByRole('button', { name: /오답 1문제 다시 풀기/ }).click();
  await page.locator('.opt').nth(2).click(); // 정답 C
  await page.getByRole('button', { name: '정답 확인' }).click();
  await expect(page.locator('.fb.right')).toBeVisible();
  await page.getByRole('button', { name: '결과 보기' }).click();
  await page.getByRole('button', { name: '목록으로' }).click();
  await expect(page.getByText('아직 오답이 없어요')).toBeVisible();
});

test('랜덤 퀴즈: 10문제', async ({ page }) => {
  await page.goto('/random?stage=code');
  await expect(page.locator('.qprog .row')).toContainText('문제 1 / 10');
  await expect(page.locator('.qtag')).toContainText(/^0[5-8] /);
});

test('없는 주소는 404 화면', async ({ page }) => {
  await page.goto('/topic/99/learn');
  await expect(page.getByRole('heading', { name: '페이지를 찾을 수 없어요' })).toBeVisible();
  await page.goto('/nope');
  await expect(page.getByRole('heading', { name: '페이지를 찾을 수 없어요' })).toBeVisible();
});

test('모든 주제의 모든 탭이 모바일 폭에서 넘치지 않아요', async ({ page }) => {
  test.setTimeout(120_000);
  for (let i = 1; i <= 16; i++) {
    const id = String(i).padStart(2, '0');
    for (const tab of ['learn', 'concept', 'qa', 'quiz']) {
      await page.goto(`/topic/${id}/${tab}`);
      await expect(page.locator('.thead h1')).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }
  }
});

test('모든 설명 섹션이 모바일 폭에서 넘치지 않아요', async ({ page }) => {
  test.setTimeout(300_000);
  for (let i = 1; i <= 16; i++) {
    const id = String(i).padStart(2, '0');
    await page.goto(`/topic/${id}/learn`);
    const count = await page.locator('.secpick a').count();
    for (let s = 1; s <= count; s++) {
      await page.goto(`/topic/${id}/learn?s=${s}`);
      await expect(page.locator('.sechead h2')).toContainText(`${s}.`);
      await expectNoHorizontalOverflow(page);
    }
  }
});

test('언어 전환: 같은 화면의 영어판으로 이동하고 진도는 이어져요', async ({ page }) => {
  await page.goto('/topic/01/qa');
  await page.locator('#card-0').getByRole('button', { name: '이해했어요' }).click();

  await page.getByRole('link', { name: 'EN', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/topic\/01\/qa$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.thead h1')).toHaveText('Discrete Math');
  // 메모리의 진도는 언어와 상관없이 같은 번호 체계라 그대로 남아 있어요.
  await expect(page.locator('.sechead span')).toContainText('1/');

  await page.getByRole('link', { name: 'Back to topics' }).click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('What will you');
  await expect(page.locator('.trow')).toHaveCount(16);

  await page.getByRole('link', { name: 'KO', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('오늘은 무엇을');
});

test('영어판: 없는 주소는 영어 404 화면', async ({ page }) => {
  await page.goto('/en/topic/99/learn');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await expect(page).toHaveTitle('Page not found · CS Interview Notes');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('영어판: 모든 주제의 모든 탭과 설명 섹션이 작은 휴대폰 폭(360px)에서도 넘치지 않고 한글이 없어요', async ({ page }) => {
  test.setTimeout(300_000);
  // 영어는 가운뎃점으로 이어진 긴 용어(Independence·Span·Basis·Dimension)가 많아서 폭에 더 민감해요.
  // 서버마다 대체 글꼴 폭이 조금씩 달라 412px에서는 통과했다 실패했다 해서, 더 좁은 360px(작은 휴대폰)로 여유 있게 검사해요.
  await page.setViewportSize({ width: 360, height: 780 });
  for (let i = 1; i <= 16; i++) {
    const id = String(i).padStart(2, '0');
    for (const tab of ['concept', 'qa', 'quiz']) {
      await page.goto(`/en/topic/${id}/${tab}`);
      await expect(page.locator('.thead h1')).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await expectNoHangul(page);
    }
    await page.goto(`/en/topic/${id}/learn`);
    const count = await page.locator('.secpick a').count();
    for (let s = 1; s <= count; s++) {
      await page.goto(`/en/topic/${id}/learn?s=${s}`);
      await expect(page.locator('.sechead h2')).toContainText(`${s}.`);
      await expectNoHorizontalOverflow(page);
      await expectNoHangul(page);
    }
  }
});

test('PWA: 한 번 방문한 뒤에는 오프라인에서도 열려요', async ({ page, context }) => {
  await page.goto('/');
  // Service Worker가 설치되고 앱 파일을 모두 캐시할 때까지 기다려요.
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise((r) => navigator.serviceWorker.addEventListener('controllerchange', r, { once: true }));
    }
    return reg.active?.state;
  });

  await context.setOffline(true);
  // 처음 열어 보는 주제도 미리 캐시(Precache)돼 있어서 네트워크 없이 열려요.
  await page.goto('/topic/15/learn?s=11');
  await expect(page.locator('.thead h1')).toHaveText('딥러닝');
  await expect(page.locator('article.lesson').first()).toBeVisible();
  await context.setOffline(false);
});
