import { STAGE_KEYS } from '../content/load';
import type { StageKey } from '../content/types';
import { useLang } from '../i18n/LangProvider';

/** 단계 필터. 누른 상태(aria-pressed)가 있는 토글 버튼이라 <button>을 씁니다. */
export function StageChips({ value, onChange }: { value: 'all' | StageKey; onChange: (v: 'all' | StageKey) => void }) {
  const { t } = useLang();
  return (
    <div className="chips" role="group" aria-label={t.stageFilter}>
      {STAGE_KEYS.map((k) => (
        <button key={k} type="button" className="chip" aria-pressed={value === k} onClick={() => onChange(k)}>
          {k === 'all' ? t.stageAll : t.stageShort[k]}
        </button>
      ))}
    </div>
  );
}
