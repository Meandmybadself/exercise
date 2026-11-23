import { Link, useNavigate } from 'react-router-dom'
import { ConfirmButton } from '../components/ConfirmButton'
import { ElapsedTime } from '../components/ElapsedTime'
import { averageDurationMs, formatDurationCompact } from '../lib/duration'
import { formatDate, formatResult, relativeDays } from '../lib/format'
import { activeExercises } from '../lib/storage'
import { exerciseName, useExerciseMap, useStore } from '../lib/store'

export function HomeScreen() {
  const { data, activeWorkout, startWorkout, deleteWorkout, updateSettings } = useStore()
  const exercises = useExerciseMap()
  const navigate = useNavigate()

  const available = activeExercises(data.exercises).length
  const completed = data.workouts.filter((w) => w.finishedAt)
  const last = completed.at(-1)
  const averageMs = averageDurationMs(data.workouts)

  const count = Math.max(1, Math.min(data.settings.exercisesPerWorkout, available))

  function setCount(n: number) {
    updateSettings({ exercisesPerWorkout: Math.max(1, Math.min(n, available)) })
  }

  function onStart() {
    const w = startWorkout(undefined, count)
    navigate(`/workout/${w.id}`)
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>Train</h1>
      </div>

      {activeWorkout ? (
        <div className="card">
          <div className="row-sub">Workout in progress</div>
          <div className="row" style={{ marginBottom: 12 }}>
            <ElapsedTime workout={activeWorkout} className="timer" />
            <span className="muted small">
              {activeWorkout.entries.filter((e) => e.status !== 'pending').length}/{activeWorkout.entries.length} done
            </span>
          </div>
          <Link to={`/workout/${activeWorkout.id}`} className="btn btn-primary btn-block">
            Resume workout
          </Link>
          <ConfirmButton
            className="btn-danger btn-block"
            confirmLabel="Tap again to cancel"
            onConfirm={() => deleteWorkout(activeWorkout.id)}
          >
            Cancel workout
          </ConfirmButton>
        </div>
      ) : (
        <div className="card">
          {available > 0 && (
            <div className="field" role="group" aria-labelledby="count-label">
              <label id="count-label">How many exercises?</label>
              <div className="row">
                <button style={{ width: 64 }} aria-label="Fewer exercises" onClick={() => setCount(count - 1)} disabled={count <= 1}>
                  −
                </button>
                <span className="stat" style={{ flex: 1, textAlign: 'center' }} aria-live="polite">
                  {count}
                </span>
                <button style={{ width: 64 }} aria-label="More exercises" onClick={() => setCount(count + 1)} disabled={count >= available}>
                  +
                </button>
              </div>
            </div>
          )}
          <p className="muted small">
            Picks {count} of your {available} exercises, favoring the ones you haven't done in a while and
            alternating opposing muscles.
          </p>
          <button className="btn-primary btn-block" onClick={onStart} disabled={available === 0}>
            Start random workout
          </button>
          {available > 0 && (
            <Link to="/choose" className="btn btn-block btn-ghost" style={{ marginTop: 8 }}>
              Choose exercises myself
            </Link>
          )}
          {available === 0 && (
            <p className="muted small" style={{ marginTop: 12 }}>
              Add some exercises first.
            </p>
          )}
        </div>
      )}

      <div className="row" style={{ marginTop: 24 }}>
        <div className="card row-main" style={{ margin: 0 }}>
          <div className="stat">{completed.length}</div>
          <div className="row-sub">workouts</div>
        </div>
        <div className="card row-main" style={{ margin: 0 }}>
          <div className="stat">{last ? relativeDays(last.startedAt).replace(' days ago', 'd') : '—'}</div>
          <div className="row-sub">last workout</div>
        </div>
        <div className="card row-main" style={{ margin: 0 }}>
          <div className="stat">{averageMs === undefined ? '—' : formatDurationCompact(averageMs)}</div>
          <div className="row-sub">avg time</div>
        </div>
      </div>

      {last && (
        <>
          <h2>Last workout · {formatDate(last.startedAt)}</h2>
          <Link to={`/history/${last.id}`} className="card link-card list">
            {last.entries.map((en) => (
              <div key={en.exerciseId} className="row">
                <span className={en.status === 'skipped' ? 'muted' : ''}>
                  {exerciseName(exercises, en.exerciseId)}
                </span>
                <span className="muted">{en.status === 'skipped' ? 'skipped' : formatResult(en.weight, en.reps)}</span>
              </div>
            ))}
          </Link>
        </>
      )}
    </div>
  )
}
