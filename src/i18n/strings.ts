/**
 * 화면 문구 사전 (UI strings).
 *
 * - 한국어(ko)가 기준이고, 영어(en)는 `typeof ko` 타입을 따라야 해요.
 *   그래서 한국어에 문구를 추가하고 영어를 빠뜨리면 컴파일 오류가 나요. 번역 누락을 런타임이 아니라 빌드에서 잡아요.
 * - 숫자가 들어가는 문구는 함수로 만들어요. 언어마다 어순이 달라서("16개 주제" vs "16 topics")
 *   문자열을 이어 붙이면 어색해지기 때문이에요.
 * - 콘텐츠(설명·문답·퀴즈)는 여기가 아니라 content/(한국어), content-en/(영어) 파일에 있어요.
 */
import type { FieldKey, StageKey } from '../content/types';

export type Lang = 'ko' | 'en';
export const LANGS: Lang[] = ['ko', 'en'];

const ko = {
  appName: 'CS 인터뷰 노트',
  langName: '한국어',

  // 홈
  homeEyebrow: 'CS Interview',
  homeTitle1: '오늘은 무엇을',
  homeTitle2: '공부할까요?',
  homeSub: (topics: number, stages: number) => `${topics}개 주제 · ${stages}단계 · 기초부터 AI까지`,
  startHere: '여기서 시작',
  continueStudy: '이어서 학습',
  statCards: '이해한 문답',
  statQuiz: '푼 퀴즈',
  statWrong: '남은 오답',
  cardsUnderstood: (ok: number, n: number) => `이해한 문답 ${ok}/${n}`,
  questionsCount: (n: number) => `${n}문항`,
  noSaveNote: '연습용이라 기록은 저장하지 않아요. 페이지를 닫거나 새로고침하면 처음부터 시작합니다.',

  // 단계
  stageFilter: '단계 필터',
  stageAll: '전체',
  stageShort: { base: '기초', code: '코드', svc: '서비스', ai: 'AI' } satisfies Record<StageKey, string>,

  // 메뉴
  menu: '메뉴',
  navTopics: '주제',
  navRandom: '랜덤 퀴즈',
  navReview: '오답 노트',
  countBadge: (n: number) => `${n}개`,

  // 주제 화면
  backToTopics: '주제 목록으로',
  studyModes: '학습 방법',
  tabs: { learn: '설명', concept: '개념 정리', qa: '문답', quiz: '퀴즈' },
  sectionPicker: '섹션 선택',
  done: '완료',
  topicIntro: '주제 소개',

  // 설명 탭
  lessonCount: (n: number) => `개념 ${n}개`,
  lessonsEmptyTitle: '이 섹션은 아직 설명을 준비 중이에요',
  lessonsEmptyBody: '문답에서 먼저 공부할 수 있어요.',
  lessonToc: '이 섹션에서 배울 것',
  learnToQa: '이해했어요 · 문답으로 확인',
  nextLesson: '다음 설명:',
  takeQuiz: '확인 퀴즈 풀기',

  // 개념 정리 탭
  oneLineAnswer: '한 줄 면접 답',
  studyOrder: '학습 순서',
  tablesAtGlance: '한눈에 보는 표',
  mustRemember: '꼭 기억할 것',
  readLessonsFirst: '설명부터 읽기',
  studyWithQa: '문답으로 공부하기',

  // 문답 탭
  understoodCount: (ok: number, n: number) => `${ok}/${n} 이해`,
  dot: { ok: '이해함', again: '다시 볼 문항', none: '아직 안 봄' },
  again: '다시 볼래요',
  gotIt: '이해했어요',
  nextSection: '다음:',

  // 퀴즈
  noQuestionsTitle: '풀 문제가 없어요',
  noQuestionsBody: '오답이 생기면 여기서 다시 풀 수 있습니다.',
  result: '결과',
  resultPerfect: '전부 맞혔어요. 면접 답을 소리 내어 한 번 더 말해 보세요.',
  resultGood: '거의 다 왔어요. 틀린 문제는 오답 노트에 모아 두었습니다.',
  resultRetry: '문답을 한 번 더 보고 다시 풀어 보세요. 틀린 문제는 오답 노트에 있습니다.',
  retry: '다시 풀기',
  questionOf: (i: number, n: number) => `문제 ${i} / ${n}`,
  correctSoFar: (n: number) => `맞힌 문제 ${n}`,
  check: '정답 확인',
  nextQuestion: '다음 문제',
  seeResult: '결과 보기',
  correct: '정답입니다',
  wrongAnswer: (letter: string) => `아쉬워요 · 정답은 ${letter}`,
  toReview: '오답 노트 보기',
  backToQa: '문답으로 돌아가기',

  // 랜덤 퀴즈
  randomEyebrow: 'Random Quiz',
  randomTitle: '섞어서 10문제',
  randomSub: '고른 단계의 확인 퀴즈에서 무작위로 뽑습니다.',

  // 오답 노트
  reviewEyebrow: 'Wrong Answers',
  reviewTitle: '오답 노트',
  reviewSub: '틀린 문제가 자동으로 모입니다. 다시 맞히면 사라져요.',
  reviewEmptyTitle: '아직 오답이 없어요',
  reviewEmptyBody: '주제별 퀴즈나 랜덤 퀴즈에서 틀린 문제가 여기에 쌓입니다.',
  redoWrong: (n: number) => `오답 ${n}문제 다시 풀기`,
  quizNo: (n: number) => `퀴즈 ${n}`,
  memorized: '외웠어요, 지우기',
  backToList: '목록으로',

  // 콘텐츠 블록
  block: { easy: '쉽게 이해하기', ans: '면접 답', mem: '기억할 것' },
  field: {
    ONE: '한 줄 정의',
    LIKE: '일상 비유',
    STEP: '하나씩 뜯어보기',
    WHY: '왜 필요할까?',
    USE: '어디에 쓰일까?',
    KEY: '꼭 알아둘 점',
    PRO: '장점',
    CON: '단점',
    END: '결론',
  } satisfies Record<FieldKey, string>,
  code: '코드',
  codeIn: (lang: string) => `${lang} 코드`,
  tableRegion: '표 (가로로 스크롤할 수 있어요)',

  // 공통
  loading: '불러오는 중…',
  notFoundTitle: '페이지를 찾을 수 없어요',
  notFoundSub: '주소가 바뀌었거나 없는 주제예요.',
  errorTitle: '문제가 생겼어요',
  errorSub: '새로고침하거나 홈에서 다시 시작해 주세요.',
  goHome: '홈으로',
};

export type Strings = typeof ko;

const en: Strings = {
  appName: 'CS Interview Notes',
  langName: 'English',

  homeEyebrow: 'CS Interview',
  homeTitle1: 'What will you',
  homeTitle2: 'learn today?',
  homeSub: (topics, stages) => `${topics} topics · ${stages} stages · from basics to AI`,
  startHere: 'Start here',
  continueStudy: 'Continue',
  statCards: 'Q&A understood',
  statQuiz: 'Quizzes taken',
  statWrong: 'To review',
  cardsUnderstood: (ok, n) => `Q&A understood ${ok}/${n}`,
  questionsCount: (n) => `${n} Q&A`,
  noSaveNote: 'This is a practice app, so nothing is saved. Closing or reloading the page starts you fresh.',

  stageFilter: 'Stage filter',
  stageAll: 'All',
  stageShort: { base: 'Basics', code: 'Code', svc: 'Services', ai: 'AI' },

  menu: 'Menu',
  navTopics: 'Topics',
  navRandom: 'Random quiz',
  navReview: 'Review',
  countBadge: (n) => `${n} items`,

  backToTopics: 'Back to topics',
  studyModes: 'Study mode',
  tabs: { learn: 'Learn', concept: 'Summary', qa: 'Q&A', quiz: 'Quiz' },
  sectionPicker: 'Choose a section',
  done: 'Done',
  topicIntro: 'Topic introduction',

  lessonCount: (n) => (n === 1 ? '1 concept' : `${n} concepts`),
  lessonsEmptyTitle: 'Lessons for this section are on the way',
  lessonsEmptyBody: 'You can start with the Q&A.',
  lessonToc: 'In this section',
  learnToQa: 'Got it · Check with Q&A',
  nextLesson: 'Next:',
  takeQuiz: 'Take the quiz',

  oneLineAnswer: 'One-line interview answer',
  studyOrder: 'Study order',
  tablesAtGlance: 'Tables at a glance',
  mustRemember: 'Must remember',
  readLessonsFirst: 'Start with the lessons',
  studyWithQa: 'Study with Q&A',

  understoodCount: (ok, n) => `${ok}/${n} understood`,
  dot: { ok: 'Understood', again: 'Review again', none: 'Not seen yet' },
  again: 'Review again',
  gotIt: 'Got it',
  nextSection: 'Next:',

  noQuestionsTitle: 'No questions here',
  noQuestionsBody: 'Questions you miss will show up here to retry.',
  result: 'Result',
  resultPerfect: 'Perfect score. Say the interview answers out loud one more time.',
  resultGood: 'Almost there. The ones you missed are saved in Review.',
  resultRetry: 'Go over the Q&A once more and try again. The ones you missed are in Review.',
  retry: 'Try again',
  questionOf: (i, n) => `Question ${i} / ${n}`,
  correctSoFar: (n) => `Correct ${n}`,
  check: 'Check answer',
  nextQuestion: 'Next question',
  seeResult: 'See result',
  correct: 'Correct',
  wrongAnswer: (letter) => `Not quite · The answer is ${letter}`,
  toReview: 'Go to Review',
  backToQa: 'Back to Q&A',

  randomEyebrow: 'Random Quiz',
  randomTitle: '10 mixed questions',
  randomSub: 'Picked at random from the quizzes in the stage you choose.',

  reviewEyebrow: 'Wrong Answers',
  reviewTitle: 'Review',
  reviewSub: 'Questions you miss collect here automatically. Get one right and it disappears.',
  reviewEmptyTitle: 'Nothing to review yet',
  reviewEmptyBody: 'Questions you miss in topic quizzes or random quizzes will show up here.',
  redoWrong: (n) => `Retry ${n} missed ${n === 1 ? 'question' : 'questions'}`,
  quizNo: (n) => `Quiz ${n}`,
  memorized: 'Got it, remove',
  backToList: 'Back to list',

  block: { easy: 'In plain words', ans: 'Interview answer', mem: 'Remember' },
  field: {
    ONE: 'In one line',
    LIKE: 'Everyday analogy',
    STEP: 'Step by step',
    WHY: 'Why does it matter?',
    USE: 'Where is it used?',
    KEY: 'Key point',
    PRO: 'Pros',
    CON: 'Cons',
    END: 'Bottom line',
  },
  code: 'Code',
  codeIn: (lang) => `${lang} code`,
  tableRegion: 'Table (scrolls sideways)',

  loading: 'Loading…',
  notFoundTitle: 'Page not found',
  notFoundSub: 'The address changed or the topic does not exist.',
  errorTitle: 'Something went wrong',
  errorSub: 'Reload the page or start again from home.',
  goHome: 'Go home',
};

export const STRINGS: Record<Lang, Strings> = { ko, en };

/** 단계 이름 (홈의 단계 제목) */
export const STAGE_NAMES: Record<Lang, Record<StageKey, { no: string; name: string }>> = {
  ko: {
    base: { no: '1단계', name: '컴퓨터의 기초' },
    code: { no: '2단계', name: '코드와 문제 해결' },
    svc: { no: '3단계', name: '서비스 만들기' },
    ai: { no: '4단계', name: '인공지능' },
  },
  en: {
    base: { no: 'Stage 1', name: 'How computers work' },
    code: { no: 'Stage 2', name: 'Code and problem solving' },
    svc: { no: 'Stage 3', name: 'Building services' },
    ai: { no: 'Stage 4', name: 'Artificial intelligence' },
  },
};
