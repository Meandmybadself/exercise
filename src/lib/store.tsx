import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { chooseExercises, pickExercises } from './planner'
import { loadData, newId, saveData } from './storage'
import type { AppData, Exercise, Settings, Theme, Workout, WorkoutEntry } from './types'

interface Store {
  data: AppData
  /** The in-progress workout, if any. */
  activeWorkout: Workout | undefined
  /** True when the last write to localStorage failed (e.g. quota exceeded). */
  saveFailed: boolean
  addExercise: (input: Omit<Exercise, 'id'>) => void
  updateExercise: (id: string, patch: Partial<Omit<Exercise, 'id'>>) => void
  removeExercise: (id: string) => void
  updateSettings: (patch: Partial<Settings>) => void
  /** Starts a workout from the given exercises, or a random pick when none are given. */
  startWorkout: (exerciseIds?: string[]) => Workout
  updateEntry: (workoutId: string, exerciseId: string, patch: Partial<WorkoutEntry>) => void
  swapEntry: (workoutId: string, exerciseId: string) => void
  finishWorkout: (workoutId: string) => void
  deleteWorkout: (workoutId: string) => void
  replaceData: (data: AppData) => void
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadData)
  const [saveFailed, setSaveFailed] = useState(false)

  useEffect(() => {
    setSaveFailed(!saveData(data))
  }, [data])

  useEffect(() => {
    const theme = data.settings.theme
    applyTheme(theme)
    if (theme !== 'system') return
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme(theme)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [data.settings.theme])

  const update = useCallback((fn: (d: AppData) => AppData) => setData((d) => fn(d)), [])

  const updateWorkout = useCallback(
    (workoutId: string, fn: (w: Workout, d: AppData) => Workout) =>
      update((d) => ({ ...d, workouts: d.workouts.map((w) => (w.id === workoutId ? fn(w, d) : w)) })),
    [update],
  )

  const activeWorkout = data.workouts.find((w) => !w.finishedAt)

  const store = useMemo<Store>(
    () => ({
      data,
      activeWorkout,
      saveFailed,

      addExercise: (input) =>
        update((d) => ({ ...d, exercises: [...d.exercises, { ...input, id: newId() }] })),

      updateExercise: (id, patch) =>
        update((d) => ({ ...d, exercises: d.exercises.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),

      // Exercises with history are archived so past workouts still resolve their name.
      removeExercise: (id) =>
        update((d) => {
          const hasHistory = d.workouts.some((w) => w.entries.some((e) => e.exerciseId === id))
          return {
            ...d,
            exercises: hasHistory
              ? d.exercises.map((e) => (e.id === id ? { ...e, archived: true } : e))
              : d.exercises.filter((e) => e.id !== id),
          }
        }),

      updateSettings: (patch) => update((d) => ({ ...d, settings: { ...d.settings, ...patch } })),

      // Only one workout may be in progress; a repeat call resumes it.
      startWorkout: (exerciseIds) => {
        if (activeWorkout) return activeWorkout
        const chosen = exerciseIds
          ? chooseExercises(data.exercises, exerciseIds)
          : pickExercises(data.exercises, data.workouts, data.settings.exercisesPerWorkout)
        const workout: Workout = {
          id: newId(),
          startedAt: new Date().toISOString(),
          entries: chosen.map((e) => ({ exerciseId: e.id, status: 'pending' })),
        }
        update((d) => ({ ...d, workouts: [...d.workouts, workout] }))
        return workout
      },

      updateEntry: (workoutId, exerciseId, patch) =>
        updateWorkout(workoutId, (w) => ({
          ...w,
          entries: w.entries.map((e) => (e.exerciseId === exerciseId ? { ...e, ...patch } : e)),
        })),

      // Replace an entry with a random exercise not already in this workout.
      swapEntry: (workoutId, exerciseId) =>
        updateWorkout(workoutId, (w, d) => {
          const inUse = new Set(w.entries.map((e) => e.exerciseId))
          const candidates = d.exercises.filter((e) => !inUse.has(e.id))
          const [replacement] = pickExercises(candidates, d.workouts, 1)
          if (!replacement) return w
          return {
            ...w,
            entries: w.entries.map((e) =>
              e.exerciseId === exerciseId ? { exerciseId: replacement.id, status: 'pending' } : e,
            ),
          }
        }),

      finishWorkout: (workoutId) =>
        updateWorkout(workoutId, (w) => ({
          ...w,
          finishedAt: new Date().toISOString(),
          entries: w.entries.map((e) => (e.status === 'pending' ? { ...e, status: 'skipped' } : e)),
        })),

      deleteWorkout: (workoutId) =>
        update((d) => ({ ...d, workouts: d.workouts.filter((w) => w.id !== workoutId) })),

      replaceData: (next) => setData(next),
    }),
    [data, activeWorkout, saveFailed, update, updateWorkout],
  )

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

/** Mirrors the theme onto <html> so CSS tokens and the browser chrome colour follow it. */
function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'system') root.removeAttribute('data-theme')
  else root.dataset.theme = theme
  const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#111111' : '#f4f4f5')
}

export function useStore(): Store {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

export function useExerciseMap(): Map<string, Exercise> {
  const { data } = useStore()
  return useMemo(() => new Map(data.exercises.map((e) => [e.id, e])), [data.exercises])
}

export function exerciseName(map: Map<string, Exercise>, id: string): string {
  return map.get(id)?.name ?? 'Unknown exercise'
}
