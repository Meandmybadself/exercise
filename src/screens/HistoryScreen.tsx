import { Link } from 'react-router-dom'
import { formatDateTime } from '../lib/format'
import { exerciseName, useExerciseMap, useStore } from '../lib/store'

export function HistoryScreen() {
  const { data } = useStore()
  const exercises = useExerciseMap()
  const workouts = data.workouts.filter((w) => w.finishedAt).reverse()

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>History</h1>
        <span className="muted">
          {workouts.length} {workouts.length === 1 ? 'workout' : 'workouts'}
        </span>
      </div>

      {workouts.length === 0 ? (
        <div className="empty">No workouts yet. Finish one and it'll show up here.</div>
      ) : (
        <div className="list">
          {workouts.map((w) => {
            const done = w.entries.filter((e) => e.status === 'done')
            return (
              <Link key={w.id} to={`/history/${w.id}`} className="card link-card">
                <div className="row">
                  <div className="row-main">
                    <div className="row-title">{formatDateTime(w.startedAt)}</div>
                    <div className="row-sub">
                      {done.map((e) => exerciseName(exercises, e.exerciseId)).join(' · ')}
                    </div>
                  </div>
                  <span className="badge">
                    {done.length}/{w.entries.length}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
