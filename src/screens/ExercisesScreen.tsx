import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Field } from '../components/Field'
import { missingFromCatalog } from '../lib/catalog'
import { MuscleSelect } from '../components/MuscleSelect'
import { formatResult, relativeDays } from '../lib/format'
import { lastResult } from '../lib/planner'
import type { MuscleGroup } from '../lib/types'
import { activeExercises } from '../lib/storage'
import { useStore } from '../lib/store'

export function ExercisesScreen() {
  const { data, addExercise, addExercises } = useStore()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [seat, setSeat] = useState('')
  const [muscle, setMuscle] = useState<MuscleGroup | undefined>()

  const missing = missingFromCatalog(data.exercises.map((e) => e.name))
  const active = activeExercises(data.exercises).sort((a, b) => a.name.localeCompare(b.name))

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    addExercise({ name: trimmed, ...(seat.trim() ? { seatSetting: seat.trim() } : {}), ...(muscle ? { muscle } : {}) })
    setName('')
    setSeat('')
    setMuscle(undefined)
    setAdding(false)
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>Exercises</h1>
        <button className="btn-sm btn-primary" onClick={() => setAdding((v) => !v)}>
          {adding ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {adding && (
        <form className="card" onSubmit={onSubmit}>
          <Field label="Name" type="text" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
          <Field
            label="Seat setting (optional)"
            type="text"
            value={seat}
            onChange={(e) => setSeat(e.target.value)}
            placeholder="e.g. Seat 4, back 2"
          />
          <MuscleSelect value={muscle} onChange={setMuscle} />
          <button type="submit" className="btn-primary btn-block">
            Add exercise
          </button>
        </form>
      )}

      {active.length === 0 ? (
        <div className="empty">No exercises yet.</div>
      ) : (
        <div className="list">
          {active.map((ex) => {
            const last = lastResult(ex.id, data.workouts)
            return (
              <Link key={ex.id} to={`/exercises/${ex.id}`} className="card link-card row">
                <div className="row-main">
                  <div className="row-title">{ex.name}</div>
                  <div className="row-sub">
                    {ex.seatSetting ? `Seat ${ex.seatSetting} · ` : ''}
                    {last ? `${formatResult(last.entry.weight, last.entry.reps)} · ${relativeDays(last.date)}` : 'never done'}
                  </div>
                </div>
                <span className="muted">›</span>
              </Link>
            )
          })}
        </div>
      )}

      {missing.length > 0 && (
        <>
          <h2>Equipment catalog</h2>
          <div className="card">
            <p className="muted small">Known machines that aren't in your library yet.</p>
            <div className="list">
              {missing.map((c) => (
                <div key={c.name} className="row">
                  <span>{c.name}</span>
                  <button className="btn-sm" onClick={() => addExercises([{ name: c.name, muscle: c.muscle }])}>
                    + Add
                  </button>
                </div>
              ))}
            </div>
            <button
              className="btn-block"
              style={{ marginTop: 12 }}
              onClick={() => addExercises(missing.map((c) => ({ name: c.name, muscle: c.muscle })))}
            >
              Add all {missing.length}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
