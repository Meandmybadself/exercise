import { useMemo, useState } from 'react'
import { exerciseKey } from '../lib/catalog'
import { formatResult, relativeDays } from '../lib/format'
import { MUSCLE_GROUPS, muscleLabel, muscleOf } from '../lib/muscles'
import { lastResult, suggestOrder, type SuggestFilter, type Suggestion } from '../lib/planner'
import { activeExercises } from '../lib/storage'
import { useStore } from '../lib/store'
import { inferMuscle } from '../lib/catalog'
import type { Exercise, Workout } from '../lib/types'

type Mode = 'closed' | 'choose' | 'suggest'

/**
 * Adds the next exercise to a workout in progress, two ways: pick one yourself, or get
 * suggestions steered by the previous exercise and the muscle you ask for.
 */
export function NextExercise({ workout, onAdd }: { workout: Workout; onAdd: (exerciseId: string) => void }) {
  const { data } = useStore()
  const [mode, setMode] = useState<Mode>('closed')

  const byId = useMemo(() => new Map(data.exercises.map((e) => [e.id, e])), [data.exercises])
  const inWorkout = new Set(workout.entries.map((e) => exerciseKey(byId.get(e.exerciseId)?.name ?? e.exerciseId)))
  const remaining = activeExercises(data.exercises).filter((e) => !inWorkout.has(exerciseKey(e.name)))

  if (remaining.length === 0) {
    return <p className="muted small" style={{ marginTop: 16 }}>Every exercise is already in this workout.</p>
  }

  function add(id: string) {
    onAdd(id)
    setMode('closed')
  }

  return (
    <div style={{ marginTop: 16 }}>
      {workout.entries.length === 0 && mode === 'closed' && (
        <p className="muted small">Nothing yet. Choose your first exercise, or get a suggestion.</p>
      )}

      <div className="btn-row" style={{ marginTop: 0 }}>
        <button
          className={mode === 'suggest' ? 'btn-primary' : ''}
          aria-pressed={mode === 'suggest'}
          onClick={() => setMode(mode === 'suggest' ? 'closed' : 'suggest')}
        >
          Suggest next
        </button>
        <button
          className={mode === 'choose' ? 'btn-primary' : ''}
          aria-pressed={mode === 'choose'}
          onClick={() => setMode(mode === 'choose' ? 'closed' : 'choose')}
        >
          Choose myself
        </button>
      </div>

      {mode === 'choose' && <ChooseList exercises={remaining} onPick={add} />}
      {mode === 'suggest' && <Suggest workout={workout} remaining={remaining} onPick={add} />}
    </div>
  )
}

function ExerciseSub({ exercise }: { exercise: Exercise }) {
  const { data } = useStore()
  const last = lastResult(exercise.id, data.workouts)
  const muscle = muscleOf(exercise, inferMuscle)
  return (
    <span className="row-sub">
      {muscle ? `${muscleLabel(muscle)} · ` : ''}
      {exercise.seatSetting ? `Seat ${exercise.seatSetting} · ` : ''}
      {last ? `${formatResult(last.entry.weight, last.entry.reps)} · ${relativeDays(last.date)}` : 'never done'}
    </span>
  )
}

function ChooseList({ exercises, onPick }: { exercises: Exercise[]; onPick: (id: string) => void }) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const shown = exercises
    .filter((e) => !q || e.name.toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div style={{ marginTop: 12 }}>
      <input
        type="text"
        aria-label="Search exercises"
        placeholder="Search exercises"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />
      <div className="list" style={{ marginTop: 8 }}>
        {shown.length === 0 && <div className="empty">No matches.</div>}
        {shown.map((ex) => (
          <button key={ex.id} className="card pick" onClick={() => onPick(ex.id)}>
            <span className="row-main">
              <span className="row-title">{ex.name}</span>
              <ExerciseSub exercise={ex} />
            </span>
            <span className="muted">+</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function Suggest({ workout, remaining, onPick }: { workout: Workout; remaining: Exercise[]; onPick: (id: string) => void }) {
  const { data } = useStore()
  const [filter, setFilter] = useState<SuggestFilter>('smart')
  const [order, setOrder] = useState<Suggestion[]>(() =>
    suggestOrder(data.exercises, data.workouts, workout.entries, 'smart'),
  )
  const [index, setIndex] = useState(0)

  // Only offer muscle chips that still have something left to suggest.
  const muscles = MUSCLE_GROUPS.filter((m) => remaining.some((e) => muscleOf(e, inferMuscle) === m))

  function steer(next: SuggestFilter) {
    setFilter(next)
    setOrder(suggestOrder(data.exercises, data.workouts, workout.entries, next))
    setIndex(0)
  }

  const current = order[index]

  return (
    <div style={{ marginTop: 12 }}>
      <div className="chips" role="radiogroup" aria-label="Steer the suggestion">
        <button role="radio" aria-checked={filter === 'smart'} className={`chip ${filter === 'smart' ? 'active' : ''}`} onClick={() => steer('smart')}>
          Smart
        </button>
        {muscles.map((m) => (
          <button key={m} role="radio" aria-checked={filter === m} className={`chip ${filter === m ? 'active' : ''}`} onClick={() => steer(m)}>
            {muscleLabel(m)}
          </button>
        ))}
      </div>

      {current ? (
        <div className="card suggestion">
          <div className="entry-title">{current.exercise.name}</div>
          <ExerciseSub exercise={current.exercise} />
          {reason(current, filter) && <div className="entry-note">{reason(current, filter)}</div>}
          <div className="btn-row">
            <button onClick={() => setIndex((i) => i + 1)} disabled={index + 1 >= order.length}>
              Another
            </button>
            <button className="btn-primary" onClick={() => onPick(current.exercise.id)}>
              Add to workout
            </button>
          </div>
          {order.length > 1 && (
            <div className="muted small" style={{ textAlign: 'center', marginTop: 8 }}>
              {index + 1} of {order.length}
            </div>
          )}
        </div>
      ) : (
        <div className="empty">Nothing left for that. Try another muscle.</div>
      )}
    </div>
  )
}

/** One line on why this exercise: opposes the last one, and how long since it was done. */
function reason(s: Suggestion, filter: SuggestFilter): string {
  const parts: string[] = []
  if (s.opposes) parts.push(`Opposes ${muscleLabel(s.opposes).toLowerCase()}`)
  else if (filter !== 'smart') parts.push(muscleLabel(filter))
  // "Never done" is already on the line above, so only say how long when it has been done.
  if (s.msSince !== Infinity) {
    const days = Math.floor(s.msSince / 86_400_000)
    parts.push(days < 1 ? 'done today' : `not done in ${days} ${days === 1 ? 'day' : 'days'}`)
  }
  const text = parts.join(' · ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}
