import { createBrowserRouter, isRouteErrorResponse, Link, Outlet, RouterProvider, ScrollRestoration, useNavigation, useRouteError } from 'react-router';
import { BottomNav } from './components/BottomNav';
import { loadQuizBank, loadTopic, NotFoundError } from './content/load';
import Home from './pages/Home';
import { ProgressProvider } from './state/ProgressProvider';

/** 모든 화면의 바깥 틀: 스크롤 복원 + 화면 전환 중 표시 */
function Root() {
  const nav = useNavigation();
  return (
    <>
      {/* 다음 화면의 데이터·코드를 받는 동안 위쪽에 얇은 진행 막대를 보여 줘요. */}
      {nav.state === 'loading' && <div className="pending" role="progressbar" aria-label="불러오는 중" />}
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
      <p className="note">불러오는 중…</p>
    </main>
  );
}

function ErrorPage() {
  const err = useRouteError();
  const notFound = isRouteErrorResponse(err) && err.status === 404;
  if (!notFound) console.error(err);
  return (
    <main className="wrap">
      <header className="hero">
        <span className="eyebrow">{notFound ? '404' : 'Error'}</span>
        <h1>{notFound ? '페이지를 찾을 수 없어요' : '문제가 생겼어요'}</h1>
        <p className="sub">{notFound ? '주소가 바뀌었거나 없는 주제예요.' : '새로고침하거나 홈에서 다시 시작해 주세요.'}</p>
      </header>
      <Link className="cta" to="/">
        홈으로
      </Link>
    </main>
  );
}

/** 라우터의 loader에서 404를 던지면 ErrorPage가 '찾을 수 없어요' 화면을 보여 줘요. */
async function topicLoader(id: string | undefined) {
  try {
    return await loadTopic(id ?? '');
  } catch (e) {
    if (e instanceof NotFoundError) throw new Response('Not Found', { status: 404 });
    throw e;
  }
}

/**
 * 라우트 정의.
 * - loader: 화면을 그리기 "전에" 필요한 데이터를 불러와요. 컴포넌트는 useLoaderData()로 받기만 하면 돼서
 *   "로딩 중 / 에러 / 데이터" 분기를 화면마다 반복하지 않아도 됩니다.
 * - lazy: 그 화면의 코드도 처음 열 때 내려받아요(Code Splitting). 홈은 첫 화면이라 바로 포함.
 */
export const router = createBrowserRouter([
  {
    element: <Root />,
    hydrateFallbackElement: <Fallback />,
    errorElement: <ErrorPage />,
    children: [
      {
        element: <WithNav />,
        children: [
          { index: true, element: <Home /> },
          { path: 'random', loader: loadQuizBank, lazy: async () => ({ Component: (await import('./pages/RandomQuiz')).default }) },
          { path: 'review', loader: loadQuizBank, lazy: async () => ({ Component: (await import('./pages/Review')).default }) },
        ],
      },
      {
        path: 'topic/:id/:tab?',
        loader: ({ params }) => topicLoader(params.id),
        lazy: async () => ({ Component: (await import('./pages/TopicPage')).default }),
      },
      { path: '*', loader: () => { throw new Response('Not Found', { status: 404 }); } },
    ],
  },
]);

export default function App() {
  return (
    <ProgressProvider>
      <RouterProvider router={router} />
    </ProgressProvider>
  );
}
