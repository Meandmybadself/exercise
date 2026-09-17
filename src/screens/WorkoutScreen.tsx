import { useNavigate, useParams } from 'react-router-dom'
import { ConfirmButton } from '../components/ConfirmButton'
import { ElapsedTime } from '../components/ElapsedTime'
import { Field } from '../components/Field'
import { NotFound } from '../components/NotFound'
import { formatResult, relativeDays } from '../lib/format'
import { lastResult } from '../lib/planner'
import { exerciseName, useExerciseMap, useStore } from '../lib/store'
import type { Workout, WorkoutEntry } from '../lib/types'

export function WorkoutScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, updateEntry, swapEntry, finishWorkout, deleteWorkout } = useStore()
  const workout = data.workouts.find((w) => w.id === id)

  if (!workout) return <NotFound what="Workout" />

  const done = workout.entries.filter((e) => e.status !== 'pending').length
  const total = workout.entries.length
  const isFinished = Boolean(workout.finishedAt)

  function onFinish() {
    finishWorkout(workout!.id)
    navigate(`/history/${workout!.id}`)
  }

  function onDiscard() {
    deleteWorkout(workout!.id)
    navigate('/')
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>Workout</h1>
        <div className="timer-block">
          <ElapsedTime workout={workout} className={`timer ${isFinished ? 'muted' : ''}`} />
          <div className="muted small">
            {isFinished ? 'final time' : 'elapsed'} · {done}/{total}
          </div>
        </div>
      </div>
      <div className="progress">
        <div style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
      </div>

      <div className="list">
        {workout.entries.map((entry) => (
          <EntryCard
            key={entry.exerciseId}
            workout={workout}
            entry={entry}
            onChange={(patch) => updateEntry(workout.id, entry.exerciseId, patch)}
            onSwap={() => swapEntry(workout.id, entry.exerciseId)}
          />
        ))}
      </div>

      {!isFinished && (
        <>
          <button className="btn-primary btn-block" style={{ marginTop: 20 }} onClick={onFinish}>
            {done === total ? 'Finish workout' : `Finish (${total - done} unfinished)`}
          </button>
          <ConfirmButton className="btn-danger btn-block" confirmLabel="Tap again to discard" onConfirm={onDiscard}>
            Discard workout
          </ConfirmButton>
        </>
      )}
    </div>
  )
}

function EntryCard({
  workout,
  entry,
  onChange,
  onSwap,
}: {
  workout: Workout
  entry: WorkoutEntry
  onChange: (patch: Partial<WorkoutEntry>) => void
  onSwap: () => void
}) {
  const { data } = useStore()
  const exercises = useExerciseMap()
  const exercise = exercises.get(entry.exerciseId)
  const previous = lastResult(entry.exerciseId, data.workouts.filter((w) => w.id !== workout.id))

  const weight = entry.weight ?? previous?.entry.weight
  const reps = entry.reps ?? previous?.entry.reps

  function markDone() {
    onChange({ status: 'done', weight, reps })
  }

  return (
    <div className={`card entry ${entry.status}`}>
      <div className="row">
        <div className="row-main">
          <div className="entry-title">{exerciseName(exercises, entry.exerciseId)}</div>
          {exercise?.seatSetting && <div className="entry-seat">Seat: {exercise.seatSetting}</div>}
        </div>
        {entry.status === 'pending' && (
          <button className="btn-sm" onClick={onSwap} title="Swap for another exercise">
            Swap
          </button>
        )}
      </div>

      <div className="entry-last">
        {previous
          ? `Last: ${formatResult(previous.entry.weight, previous.entry.reps)} · ${relativeDays(previous.date)}`
          : 'First time'}
      </div>

      {entry.status === 'skipped' ? (
        <button className="btn-sm" onClick={() => onChange({ status: 'pending' })}>
          Undo skip
        </button>
      ) : (
        <>
          <div className="field-row">
            <Field
              label="Weight"
              type="number"
              inputMode="decimal"
              className="num-input"
              value={weight ?? ''}
              onChange={(e) => onChange({ weight: e.target.value === '' ? undefined : Number(e.target.value) })}
            />
            <Field
              label="Reps"
              type="number"
              inputMode="numeric"
              className="num-input"
              value={reps ?? ''}
              onChange={(e) => onChange({ reps: e.target.value === '' ? undefined : Number(e.target.value) })}
            />
          </div>
          {entry.status === 'pending' ? (
            <div className="btn-row" style={{ marginTop: 0 }}>
              <button className="btn-ghost" onClick={() => onChange({ status: 'skipped' })}>
                Skip
              </button>
              <button className="btn-primary" onClick={markDone}>
                Done
              </button>
            </div>
          ) : (
            <button className="btn-sm" onClick={() => onChange({ status: 'pending' })}>
              Mark not done
            </button>
          )}
        </>
      )}
    </div>
  )
}
