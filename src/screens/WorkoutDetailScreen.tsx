import { Link, useNavigate, useParams } from 'react-router-dom'
import { ConfirmButton } from '../components/ConfirmButton'
import { NotFound } from '../components/NotFound'
import { formatDateTime, formatResult } from '../lib/format'
import { exerciseName, useExerciseMap, useStore } from '../lib/store'

export function WorkoutDetailScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, deleteWorkout } = useStore()
  const exercises = useExerciseMap()
  const workout = data.workouts.find((w) => w.id === id)

  if (!workout) return <NotFound what="Workout" />

  const duration = workout.finishedAt
    ? Math.round((Date.parse(workout.finishedAt) - Date.parse(workout.startedAt)) / 60_000)
    : undefined

  return (
    <div className="screen">
      <div className="screen-header">
        <div>
          <h1>{formatDateTime(workout.startedAt)}</h1>
          {duration !== undefined && <div className="muted small">{duration} min</div>}
        </div>
      </div>

      <div className="list">
        {workout.entries.map((en) => (
          <Link key={en.exerciseId} to={`/exercises/${en.exerciseId}`} className="card link-card row">
            <span className={en.status === 'skipped' ? 'muted' : 'row-title'}>
              {exerciseName(exercises, en.exerciseId)}
            </span>
            <span className="muted">{en.status === 'skipped' ? 'skipped' : formatResult(en.weight, en.reps)}</span>
          </Link>
        ))}
      </div>

      {!workout.finishedAt && (
        <Link to={`/workout/${workout.id}`} className="btn btn-primary btn-block" style={{ marginTop: 16 }}>
          Resume
        </Link>
      )}

      <ConfirmButton
        className="btn-danger btn-block"
        confirmLabel="Tap again to delete"
        onConfirm={() => {
          deleteWorkout(workout.id)
          navigate('/history')
        }}
      >
        Delete workout
      </ConfirmButton>
    </div>
  )
}
