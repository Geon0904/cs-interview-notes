import { STAGE_FILTERS } from '../content/load';
import type { StageKey } from '../content/types';

/** 단계 필터. 누른 상태(aria-pressed)가 있는 토글 버튼이라 <button>을 씁니다. */
export function StageChips({ value, onChange }: { value: 'all' | StageKey; onChange: (v: 'all' | StageKey) => void }) {
  return (
    <div className="chips" role="group" aria-label="단계 필터">
      {STAGE_FILTERS.map((f) => (
        <button key={f.key} type="button" className="chip" aria-pressed={value === f.key} onClick={() => onChange(f.key)}>
          {f.label}
        </button>
      ))}
    </div>
  );
}
