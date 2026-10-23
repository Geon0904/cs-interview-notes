/**
 * Fisher–Yates 셔플: 모든 순서가 정확히 같은 확률(1/n!)로 나오는 O(n) 섞기.
 * 뒤에서부터 i번째 칸을 0..i 중 무작위 칸과 바꿔요. 원본 배열은 바꾸지 않습니다.
 *
 * 흔한 실수인 `arr.sort(() => Math.random() - 0.5)`는 정렬 알고리즘에 따라 결과가 치우쳐요.
 * rand를 인자로 받는 이유: 테스트에서 정해진 난수를 넣어 결과를 검증하려고요.
 */
export function shuffle<T>(arr: readonly T[], rand: () => number = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}
