import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Field } from '../components/Field'
import { formatResult, relativeDays } from '../lib/format'
import { lastResult } from '../lib/planner'
import { activeExercises } from '../lib/storage'
import { useStore } from '../lib/store'

export function ExercisesScreen() {
  const { data, addExercise } = useStore()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [seat, setSeat] = useState('')

  const active = activeExercises(data.exercises).sort((a, b) => a.name.localeCompare(b.name))

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    addExercise({ name: trimmed, ...(seat.trim() ? { seatSetting: seat.trim() } : {}) })
    setName('')
    setSeat('')
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
    </div>
  )
}
