/**
 * 콘텐츠 빌드 스크립트: content/*.md → src/generated/*.json
 *
 * `npm run dev` / `npm run build` 직전에 npm의 pre 스크립트로 자동 실행돼요.
 * 결과물은 세 종류로 나눠서, 화면마다 필요한 만큼만 내려받게 합니다.
 *   - index.json      : 홈 화면용 요약 (주제 이름, 섹션별 카드 수)  → 첫 화면에 바로 포함
 *   - quiz.json       : 모든 퀴즈 (랜덤 퀴즈·오답 노트용)          → 그 화면을 열 때 로드
 *   - topics/NN.json  : 주제 본문 전체                              → 그 주제를 열 때 로드
 */
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ContentError, parseTopic } from './content/parser';
import { buildIndex, buildQuizBank, STAGES } from './content/assemble';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = join(root, 'content');
const outDir = join(root, 'src', 'generated');

function main() {
  const files = readdirSync(contentDir).filter((f) => f.endsWith('.md')).sort();
  const topics = files.map((f) => parseTopic(readFileSync(join(contentDir, f), 'utf8'), `content/${f}`));

  const index = buildIndex(topics, STAGES);
  const bank = buildQuizBank(topics);

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(join(outDir, 'topics'), { recursive: true });
  writeFileSync(join(outDir, 'index.json'), JSON.stringify(index));
  writeFileSync(join(outDir, 'quiz.json'), JSON.stringify(bank));
  let total = 0;
  for (const t of topics) {
    const json = JSON.stringify(t);
    total += json.length;
    writeFileSync(join(outDir, 'topics', `${t.id}.json`), json);
  }

  const count = (pick: (s: (typeof topics)[number]['sections'][number]) => number) =>
    topics.reduce((n, t) => n + t.sections.reduce((m, s) => m + pick(s), 0), 0);
  console.log(
    `content: ${topics.length} topics · ${count((s) => s.lessons.length)} lessons · ` +
      `${count((s) => s.cards.length)} cards · ${topics.reduce((n, t) => n + t.quiz.length, 0)} quiz · ` +
      `${(total / 1024).toFixed(0)} KB`,
  );
}

try {
  main();
} catch (e) {
  if (e instanceof ContentError) {
    console.error(`\n콘텐츠 오류 → ${e.message}\n`);
    process.exit(1);
  }
  throw e;
}
