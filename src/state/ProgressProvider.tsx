import { createContext, use, useReducer, type Dispatch, type ReactNode } from 'react';
import { initialProgress, progressReducer, type Progress, type ProgressAction } from './progress';

/**
 * 진도 상태를 앱 전체에 공유하는 Context.
 *
 * 왜 Redux·Zustand 같은 라이브러리를 쓰지 않았나요?
 * 상태가 객체 하나이고, 서버 동기화나 저장도 없어서 React 기본 기능(useReducer + Context)으로 충분해요.
 * 의존성이 하나 줄고, 면접에서 "상태 흐름을 처음부터 끝까지 직접 설명"할 수 있다는 장점도 있어요.
 *
 * 상태와 dispatch를 서로 다른 Context로 나눈 이유:
 * dispatch는 절대 바뀌지 않는 함수라서, 버튼처럼 "보내기만 하는" 컴포넌트는
 * 상태가 바뀌어도 다시 렌더링되지 않게 할 수 있어요.
 */
const StateContext = createContext<Progress | null>(null);
const DispatchContext = createContext<Dispatch<ProgressAction> | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(progressReducer, initialProgress);
  return (
    <StateContext value={state}>
      <DispatchContext value={dispatch}>{children}</DispatchContext>
    </StateContext>
  );
}

export function useProgress(): Progress {
  const v = use(StateContext);
  if (!v) throw new Error('useProgress는 <ProgressProvider> 안에서만 쓸 수 있어요');
  return v;
}

export function useProgressDispatch(): Dispatch<ProgressAction> {
  const v = use(DispatchContext);
  if (!v) throw new Error('useProgressDispatch는 <ProgressProvider> 안에서만 쓸 수 있어요');
  return v;
}
