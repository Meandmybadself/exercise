import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ConfirmButton } from '../components/ConfirmButton'
import { Field } from '../components/Field'
import { NotFound } from '../components/NotFound'
import { formatDate, formatResult } from '../lib/format'
import { useStore } from '../lib/store'

export function ExerciseDetailScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, updateExercise, removeExercise } = useStore()
  const exercise = data.exercises.find((e) => e.id === id)

  const [name, setName] = useState(exercise?.name ?? '')
  const [seat, setSeat] = useState(exercise?.seatSetting ?? '')

  if (!exercise) return <NotFound what="Exercise" />

  const history = data.workouts
    .filter((w) => w.finishedAt)
    .flatMap((w) => {
      const entry = w.entries.find((e) => e.exerciseId === exercise.id && e.status === 'done')
      return entry ? [{ workoutId: w.id, date: w.startedAt, entry }] : []
    })
    .reverse()

  const dirty = name.trim() !== exercise.name || seat.trim() !== (exercise.seatSetting ?? '')

  function save() {
    const trimmed = name.trim()
    if (!trimmed) return
    updateExercise(exercise!.id, { name: trimmed, seatSetting: seat.trim() || undefined })
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>{exercise.name}</h1>
        {exercise.archived && <span className="badge">archived</span>}
      </div>

      <div className="card">
        <Field label="Name" type="text" value={name} onChange={(e) => setName(e.target.value)} />
        <Field
          label="Seat setting (optional)"
          type="text"
          value={seat}
          onChange={(e) => setSeat(e.target.value)}
          placeholder="e.g. Seat 4, back 2"
        />
        <button className="btn-primary btn-block" onClick={save} disabled={!dirty || !name.trim()}>
          Save
        </button>
      </div>

      <h2>Progress</h2>
      {history.length === 0 ? (
        <div className="empty">No completed sets yet.</div>
      ) : (
        <div className="list">
          {history.map((h, i) => {
            const prev = history[i + 1]?.entry
            const delta = prev?.weight !== undefined && h.entry.weight !== undefined ? h.entry.weight - prev.weight : 0
            return (
              <Link key={h.workoutId} to={`/history/${h.workoutId}`} className="card link-card row">
                <div className="row-main">
                  <div className="row-title">{formatResult(h.entry.weight, h.entry.reps)}</div>
                  <div className="row-sub">{formatDate(h.date)}</div>
                </div>
                {delta !== 0 && (
                  <span className={`badge ${delta > 0 ? 'up' : 'down'}`}>
                    {delta > 0 ? '+' : ''}
                    {delta}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      )}

      {exercise.archived ? (
        <button className="btn-block" style={{ marginTop: 16 }} onClick={() => updateExercise(exercise.id, { archived: false })}>
          Restore exercise
        </button>
      ) : (
        <ConfirmButton
          className="btn-danger btn-block"
          confirmLabel="Tap again to remove"
          onConfirm={() => {
            removeExercise(exercise.id)
            navigate('/exercises')
          }}
        >
          Remove exercise
        </ConfirmButton>
      )}
    </div>
  )
}
