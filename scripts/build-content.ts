/**
 * 콘텐츠 빌드 스크립트: content/*.md(한국어) + content-en/*.md(영어) → src/generated/<lang>/*.json
 *
 * `npm run dev` / `npm run build` 직전에 npm의 pre 스크립트로 자동 실행돼요.
 * 언어마다 결과물을 세 종류로 나눠서, 화면마다 필요한 만큼만 내려받게 합니다.
 *   - index.json      : 홈 화면용 요약 (주제 이름, 섹션별 카드 수)  → 첫 화면에 바로 포함
 *   - quiz.json       : 모든 퀴즈 (랜덤 퀴즈·오답 노트용)          → 그 화면을 열 때 로드
 *   - topics/NN.json  : 주제 본문 전체                              → 그 주제를 열 때 로드
 *
 * 영어 파일은 한국어 파일과 구조가 똑같아야 해요(checkParity). 아직 번역하지 않은 주제는
 * 한국어 원문으로 대신 채우고 경고를 띄워요. `--strict`이면 경고 대신 빌드를 멈춰요(CI용).
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Topic } from '../src/content/types';
import { buildIndex, buildQuizBank, checkParity, STAGES } from './content/assemble';
import { ContentError, parseTopic } from './content/parser';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const strict = process.argv.includes('--strict');

function readDir(dir: string): Map<string, Topic> {
  const out = new Map<string, Topic>();
  if (!existsSync(join(root, dir))) return out;
  for (const f of readdirSync(join(root, dir)).filter((x) => x.endsWith('.md')).sort()) {
    out.set(f, parseTopic(readFileSync(join(root, dir, f), 'utf8'), `${dir}/${f}`));
  }
  return out;
}

function write(lang: 'ko' | 'en', topics: Topic[], fallback: string[]) {
  const outDir = join(root, 'src', 'generated', lang);
  mkdirSync(join(outDir, 'topics'), { recursive: true });
  writeFileSync(join(outDir, 'index.json'), JSON.stringify(buildIndex(topics, STAGES, fallback)));
  writeFileSync(join(outDir, 'quiz.json'), JSON.stringify(buildQuizBank(topics, lang)));
  for (const t of topics) writeFileSync(join(outDir, 'topics', `${t.id}.json`), JSON.stringify(t));
}

function main() {
  const ko = readDir('content');
  const en = readDir('content-en');

  for (const f of en.keys()) {
    if (!ko.has(f)) throw new ContentError(`content-en/${f}`, null, '같은 이름의 한국어 파일이 없어요');
  }
  const enTopics: Topic[] = [];
  const fallback: string[] = [];
  for (const [f, k] of ko) {
    const e = en.get(f);
    if (e) {
      checkParity(k, e, `content-en/${f}`);
      enTopics.push(e);
    } else {
      fallback.push(k.id);
      enTopics.push(k);
    }
  }
  if (fallback.length && strict) {
    throw new ContentError('content-en', null, `번역되지 않은 주제가 있어요: ${fallback.join(', ')}`);
  }

  rmSync(join(root, 'src', 'generated'), { recursive: true, force: true });
  const koTopics = [...ko.values()];
  write('ko', koTopics, []);
  write('en', enTopics, fallback);

  const count = (pick: (s: Topic['sections'][number]) => number) =>
    koTopics.reduce((n, t) => n + t.sections.reduce((m, s) => m + pick(s), 0), 0);
  console.log(
    `content: ${koTopics.length} topics · ${count((s) => s.lessons.length)} lessons · ` +
      `${count((s) => s.cards.length)} cards · ${koTopics.reduce((n, t) => n + t.quiz.length, 0)} quiz · ` +
      `en ${koTopics.length - fallback.length}/${koTopics.length} translated`,
  );
  if (fallback.length) console.warn(`⚠ 영어 번역 대기 중(한국어로 대체): ${fallback.join(', ')}`);
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
