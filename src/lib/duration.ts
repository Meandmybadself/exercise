import type { Workout } from './types'

/**
 * Elapsed time of a workout: start to finish, or start to now while it's
 * still running. Undefined when the timestamps can't be parsed.
 */
export function workoutDurationMs(workout: Workout, now = Date.now()): number | undefined {
  const start = Date.parse(workout.startedAt)
  const end = workout.finishedAt ? Date.parse(workout.finishedAt) : now
  if (Number.isNaN(start) || Number.isNaN(end)) return undefined
  return Math.max(0, end - start)
}

/** Running clock for the live timer: 12:34, or 1:02:03 once past an hour. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`
}

/** Readable length for history rows: 48 min, 1h 12m. */
export function formatDuration(ms: number): string {
  if (ms < 60_000) return '< 1 min'
  const minutes = Math.round(ms / 60_000)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`
}

/** Tight form for stat tiles, where width is scarce: 48m, 1h12. */
export function formatDurationCompact(ms: number): string {
  const minutes = Math.round(ms / 60_000)
  if (minutes < 60) return `${Math.max(1, minutes)}m`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours}h` : `${hours}h${rest}`
}

/** Mean length of the finished workouts, or undefined when there are none. */
export function averageDurationMs(workouts: Workout[]): number | undefined {
  const lengths = workouts
    .filter((w) => w.finishedAt)
    .map((w) => workoutDurationMs(w))
    .filter((ms): ms is number => ms !== undefined)
  if (lengths.length === 0) return undefined
  return lengths.reduce((sum, ms) => sum + ms, 0) / lengths.length
}
