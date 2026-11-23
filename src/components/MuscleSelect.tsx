import { useId } from 'react'
import { isMuscleGroup, MUSCLE_GROUPS, muscleLabel } from '../lib/muscles'
import type { MuscleGroup } from '../lib/types'

/** Picks the main muscle worked, which drives push/pull alternation in workouts. */
export function MuscleSelect({
  value,
  onChange,
}: {
  value: MuscleGroup | undefined
  onChange: (muscle: MuscleGroup | undefined) => void
}) {
  const id = useId()
  return (
    <div className="field">
      <label htmlFor={id}>Muscle group</label>
      <select id={id} value={value ?? ''} onChange={(e) => onChange(isMuscleGroup(e.target.value) ? e.target.value : undefined)}>
        <option value="">Not set</option>
        {MUSCLE_GROUPS.map((m) => (
          <option key={m} value={m}>
            {muscleLabel(m)}
          </option>
        ))}
      </select>
    </div>
  )
}
