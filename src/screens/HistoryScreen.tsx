import { Link } from 'react-router-dom'
import { averageDurationMs, formatDuration, workoutDurationMs } from '../lib/duration'
import { formatDateTime } from '../lib/format'
import { exerciseName, useExerciseMap, useStore } from '../lib/store'

export function HistoryScreen() {
  const { data } = useStore()
  const exercises = useExerciseMap()
  const workouts = data.workouts.filter((w) => w.finishedAt).reverse()
  const averageMs = averageDurationMs(data.workouts)

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>History</h1>
        <span className="muted small">
          {workouts.length} {workouts.length === 1 ? 'workout' : 'workouts'}
          {averageMs !== undefined && ` · avg ${formatDuration(averageMs)}`}
        </span>
      </div>

      {workouts.length === 0 ? (
        <div className="empty">No workouts yet. Finish one and it'll show up here.</div>
      ) : (
        <div className="list">
          {workouts.map((w) => {
            const done = w.entries.filter((e) => e.status === 'done')
            const duration = workoutDurationMs(w)
            return (
              <Link key={w.id} to={`/history/${w.id}`} className="card link-card">
                <div className="row">
                  <div className="row-main">
                    <div className="row-title">{formatDateTime(w.startedAt)}</div>
                    <div className="row-sub">
                      {done.map((e) => exerciseName(exercises, e.exerciseId)).join(' · ')}
                    </div>
                  </div>
                  <div className="row-end">
                    <span className="badge">
                      {done.length}/{w.entries.length}
                    </span>
                    {duration !== undefined && <span className="muted small">{formatDuration(duration)}</span>}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
