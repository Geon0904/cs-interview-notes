import {
  createBrowserRouter,
  isRouteErrorResponse,
  Link,
  Outlet,
  redirect,
  RouterProvider,
  ScrollRestoration,
  useLocation,
  useNavigation,
  useRouteError,
  type RouteObject,
} from 'react-router';
import { BottomNav } from './components/BottomNav';
import { loadQuizBank, loadTopic, NotFoundError } from './content/load';
import { LangProvider, savedLang } from './i18n/LangProvider';
import { STRINGS, type Lang } from './i18n/strings';
import Home from './pages/Home';
import { ProgressProvider } from './state/ProgressProvider';

/** 모든 화면의 바깥 틀: 스크롤 복원 + 화면 전환 중 표시 */
function Root() {
  const nav = useNavigation();
  const { pathname } = useLocation();
  const t = STRINGS[pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'ko'];
  return (
    <>
      {/* 다음 화면의 데이터·코드를 받는 동안 위쪽에 얇은 진행 막대를 보여 줘요. */}
      {nav.state === 'loading' && <div className="pending" role="progressbar" aria-label={t.loading} />}
      <Outlet />
      {/* 새 화면은 맨 위에서, 뒤로 가기는 원래 보던 위치에서 시작 */}
      <ScrollRestoration />
    </>
  );
}

/** 하단 메뉴가 있는 화면들(홈·랜덤 퀴즈·오답 노트)의 틀 */
function WithNav() {
  return (
    <>
      <Outlet />
      <BottomNav />
    </>
  );
}

function Fallback() {
  return (
    <main className="wrap">
      <p className="note">{STRINGS.ko.loading}</p>
    </main>
  );
}

/** 에러 화면은 언어 Provider 바깥에서도 그려질 수 있어서, 주소로 언어를 직접 판단해요. */
function ErrorPage() {
  const err = useRouteError();
  const { pathname } = useLocation();
  const lang: Lang = pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'ko';
  const t = STRINGS[lang];
  const notFound = isRouteErrorResponse(err) && err.status === 404;
  if (!notFound) console.error(err);
  return (
    <main className="wrap">
      <header className="hero">
        <span className="eyebrow">{notFound ? '404' : 'Error'}</span>
        <h1>{notFound ? t.notFoundTitle : t.errorTitle}</h1>
        <p className="sub">{notFound ? t.notFoundSub : t.errorSub}</p>
      </header>
      <Link className="cta" to={lang === 'en' ? '/en' : '/'}>
        {t.goHome}
      </Link>
    </main>
  );
}

/** 라우터의 loader에서 404를 던지면 ErrorPage가 '찾을 수 없어요' 화면을 보여 줘요. */
async function topicLoader(lang: Lang, id: string | undefined) {
  try {
    return await loadTopic(lang, id ?? '');
  } catch (e) {
    if (e instanceof NotFoundError) throw new Response('Not Found', { status: 404 });
    throw e;
  }
}

/**
 * 한 언어의 라우트 묶음. 한국어는 '/', 영어는 '/en' 아래에 같은 모양으로 붙여요.
 * - loader: 화면을 그리기 "전에" 필요한 데이터를 불러와요. 컴포넌트는 useLoaderData()로 받기만 하면 돼서
 *   "로딩 중 / 에러 / 데이터" 분기를 화면마다 반복하지 않아도 됩니다.
 * - lazy: 그 화면의 코드도 처음 열 때 내려받아요(Code Splitting). 홈은 첫 화면이라 바로 포함.
 */
function langRoutes(lang: Lang): RouteObject[] {
  return [
    {
      element: <WithNav />,
      children: [
        {
          index: true,
          element: <Home />,
          // 영어를 고른 적이 있으면 '/'로 들어와도 영어 홈으로 (설치한 앱을 다시 열 때 등)
          loader: lang === 'ko' ? () => (savedLang() === 'en' ? redirect('/en') : null) : undefined,
        },
        { path: 'random', loader: () => loadQuizBank(lang), lazy: async () => ({ Component: (await import('./pages/RandomQuiz')).default }) },
        { path: 'review', loader: () => loadQuizBank(lang), lazy: async () => ({ Component: (await import('./pages/Review')).default }) },
      ],
    },
    {
      path: 'topic/:id/:tab?',
      loader: ({ params }) => topicLoader(lang, params.id),
      lazy: async () => ({ Component: (await import('./pages/TopicPage')).default }),
    },
    { path: '*', loader: () => { throw new Response('Not Found', { status: 404 }); } },
  ];
}

export const router = createBrowserRouter([
  {
    element: <Root />,
    hydrateFallbackElement: <Fallback />,
    errorElement: <ErrorPage />,
    children: [
      // 'en'이 고정 경로라서 한국어 쪽의 '*'보다 먼저 맞춰져요(React Router의 경로 점수 규칙).
      { path: 'en', element: <LangOutlet lang="en" />, children: langRoutes('en') },
      { element: <LangOutlet lang="ko" />, children: langRoutes('ko') },
    ],
  },
]);

function LangOutlet({ lang }: { lang: Lang }) {
  return (
    <LangProvider lang={lang}>
      <Outlet />
    </LangProvider>
  );
}

export default function App() {
  return (
    <ProgressProvider>
      <RouterProvider router={router} />
    </ProgressProvider>
  );
}
