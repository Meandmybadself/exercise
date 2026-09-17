import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatResult, relativeDays } from '../lib/format'
import { lastResult } from '../lib/planner'
import { activeExercises } from '../lib/storage'
import { useStore } from '../lib/store'

/** Build a workout by hand: tap exercises in the order you want to do them. */
export function ChooseWorkoutScreen() {
  const { data, startWorkout } = useStore()
  const navigate = useNavigate()
  const [picked, setPicked] = useState<string[]>([])

  const available = activeExercises(data.exercises).sort((a, b) => a.name.localeCompare(b.name))

  function toggle(id: string) {
    setPicked((ids) => (ids.includes(id) ? ids.filter((other) => other !== id) : [...ids, id]))
  }

  function onStart() {
    const workout = startWorkout(picked)
    navigate(`/workout/${workout.id}`)
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>Choose</h1>
        <button className="btn-sm" onClick={() => navigate('/')}>
          Cancel
        </button>
      </div>

      {available.length === 0 ? (
        <div className="empty">No exercises yet. Add some first.</div>
      ) : (
        <>
          <p className="muted small">
            Tap the exercises you want, in the order you'll do them. Or start with none and add them one at a time as
            you go.
          </p>

          <div className="list">
            {available.map((ex) => {
              const order = picked.indexOf(ex.id)
              const last = lastResult(ex.id, data.workouts)
              return (
                <button
                  key={ex.id}
                  className={`card pick ${order >= 0 ? 'selected' : ''}`}
                  aria-pressed={order >= 0}
                  onClick={() => toggle(ex.id)}
                >
                  <span className="pick-order">{order >= 0 ? order + 1 : ''}</span>
                  <span className="row-main">
                    <span className="row-title">{ex.name}</span>
                    <span className="row-sub">
                      {ex.seatSetting ? `Seat ${ex.seatSetting} · ` : ''}
                      {last
                        ? `${formatResult(last.entry.weight, last.entry.reps)} · ${relativeDays(last.date)}`
                        : 'never done'}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>

          <div className="sticky-actions">
            <button className="btn-primary btn-block" onClick={onStart}>
              {picked.length === 0
                ? 'Start and pick as I go'
                : `Start workout (${picked.length} ${picked.length === 1 ? 'exercise' : 'exercises'})`}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
