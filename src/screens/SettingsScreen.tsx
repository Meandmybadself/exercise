import { useRef, useState } from 'react'
import { ConfirmButton } from '../components/ConfirmButton'
import { activeExercises, validateData } from '../lib/storage'
import { useStore } from '../lib/store'
import type { AppData } from '../lib/types'

export function SettingsScreen() {
  const { data, saveFailed, updateSettings, replaceData } = useStore()
  const fileInput = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<AppData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const available = activeExercises(data.exercises).length

  function onExport() {
    const stamp = new Date().toISOString().slice(0, 10)
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `exercise-${stamp}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function onFileChosen(file: File | undefined) {
    setError(null)
    setMessage(null)
    setPending(null)
    if (!file) return
    try {
      setPending(validateData(JSON.parse(await file.text())))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read file')
    }
    if (fileInput.current) fileInput.current.value = ''
  }

  function applyImport() {
    if (!pending) return
    replaceData(pending)
    setMessage(`Imported ${pending.exercises.length} exercises and ${pending.workouts.length} workouts.`)
    setPending(null)
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>Settings</h1>
      </div>

      {saveFailed && (
        <div className="card error">
          Couldn't save to this browser's storage (it may be full). Export your data now to avoid losing it.
        </div>
      )}

      <div className="card">
        <div className="field" style={{ marginBottom: 0 }} role="group" aria-labelledby="per-workout-label">
          <label id="per-workout-label">Exercises per workout</label>
          <div className="row">
            <button
              style={{ width: 64 }}
              aria-label="Fewer exercises"
              onClick={() => updateSettings({ exercisesPerWorkout: Math.max(1, data.settings.exercisesPerWorkout - 1) })}
              disabled={data.settings.exercisesPerWorkout <= 1}
            >
              −
            </button>
            <span className="stat" style={{ flex: 1, textAlign: 'center' }} aria-live="polite">
              {data.settings.exercisesPerWorkout}
            </span>
            <button
              style={{ width: 64 }}
              aria-label="More exercises"
              onClick={() => updateSettings({ exercisesPerWorkout: data.settings.exercisesPerWorkout + 1 })}
            >
              +
            </button>
          </div>
          {data.settings.exercisesPerWorkout > available && (
            <p className="muted small" style={{ marginTop: 8 }}>
              You only have {available} active exercises, so workouts will use all of them.
            </p>
          )}
        </div>
      </div>

      <h2>Backup</h2>
      <div className="card">
        <p className="muted small">
          Everything lives in this browser's local storage. Export regularly so a cleared cache doesn't wipe your
          history.
        </p>
        <button className="btn-block" onClick={onExport}>
          Export history & configuration
        </button>
      </div>

      <div className="card">
        <p className="muted small">Importing replaces all current exercises, workouts and settings.</p>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => onFileChosen(e.target.files?.[0])}
        />
        <button className="btn-block" onClick={() => fileInput.current?.click()}>
          Choose file to import…
        </button>

        {pending && (
          <div style={{ marginTop: 12 }}>
            <p className="small">
              File contains <strong>{pending.exercises.length}</strong> exercises and{' '}
              <strong>{pending.workouts.length}</strong> workouts. This will replace your current{' '}
              {data.exercises.length} exercises and {data.workouts.length} workouts.
            </p>
            <div className="btn-row">
              <button onClick={() => setPending(null)}>Cancel</button>
              <ConfirmButton className="btn-primary" confirmLabel="Tap again to replace" onConfirm={applyImport}>
                Import
              </ConfirmButton>
            </div>
          </div>
        )}
        {error && <p className="error" style={{ marginTop: 12 }}>{error}</p>}
        {message && <p className="small" style={{ marginTop: 12, color: 'var(--accent)' }}>{message}</p>}
      </div>

      <p className="muted small" style={{ marginTop: 24, textAlign: 'center' }}>
        {data.exercises.length} exercises · {data.workouts.length} workouts stored
      </p>
    </div>
  )
}
