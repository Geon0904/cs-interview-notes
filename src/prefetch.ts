import { loadTopic } from './content/load';

/**
 * 미리 받아 두기(Prefetch): 사용자가 주제에 손가락·마우스를 올리는 순간 그 주제의 본문과 화면 코드를
 * 백그라운드에서 받아 둡니다. 실제로 누를 때쯤이면 이미 받아져 있어서 화면이 바로 바뀌어요.
 * 같은 import()를 두 번 불러도 브라우저가 모듈을 한 번만 받으므로 중복 다운로드는 없어요.
 */
export function prefetchTopic(id: string) {
  loadTopic(id).catch(() => {}); // 실패해도(오프라인 등) 실제 이동 때 다시 시도하므로 무시
  import('./pages/TopicPage').catch(() => {});
}
