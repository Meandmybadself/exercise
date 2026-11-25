import { inferMuscle } from './catalog'
import { alternateMuscles, muscleOf, musclesOppose } from './muscles'
import type { Exercise, Workout, WorkoutEntry } from './types'

/** Milliseconds since the exercise was last logged as done; Infinity if never. */
export function msSinceLastDone(exerciseId: string, workouts: Workout[], now = Date.now()): number {
  let latest = -Infinity
  for (const w of workouts) {
    for (const e of w.entries) {
      if (e.exerciseId === exerciseId && e.status === 'done') {
        latest = Math.max(latest, Date.parse(w.startedAt))
      }
    }
  }
  return latest === -Infinity ? Infinity : now - latest
}

const muscleFor = (e: Exercise) => muscleOf(e, inferMuscle)

/**
 * Picks `count` exercises at random, weighted toward those done least recently.
 * Never-done exercises get the highest weight. Weighted sampling without replacement.
 * Each pick after the first is drawn from muscles opposing the previous one when any
 * remain, so the result alternates (push/pull, quads/hamstrings, ...).
 */
export function pickExercises(
  exercises: Exercise[],
  workouts: Workout[],
  count: number,
  random: () => number = Math.random,
): Exercise[] {
  const pool = exercises.filter((e) => !e.archived)
  const DAY = 86_400_000
  const weighted = pool.map((exercise) => {
    const ms = msSinceLastDone(exercise.id, workouts)
    // 1 + days since last done, capped so ancient exercises don't dominate absolutely.
    const days = ms === Infinity ? 60 : Math.min(60, ms / DAY)
    return { exercise, weight: 1 + days }
  })

  const picked: Exercise[] = []
  while (picked.length < count && weighted.length > 0) {
    const prev = picked.at(-1)
    const opposing = prev
      ? weighted.flatMap((w, i) => (musclesOppose(muscleFor(prev), muscleFor(w.exercise)) ? [i] : []))
      : []
    const candidates = opposing.length > 0 ? opposing : weighted.map((_, i) => i)
    const total = candidates.reduce((sum, i) => sum + weighted[i].weight, 0)
    let r = random() * total
    let idx = candidates[candidates.length - 1]
    for (const i of candidates) {
      r -= weighted[i].weight
      if (r <= 0) {
        idx = i
        break
      }
    }
    picked.push(weighted[idx].exercise)
    weighted.splice(idx, 1)
  }
  return picked
}

/**
 * Resolves hand-picked exercise ids in the order they were chosen, dropping
 * ids that are unknown, archived, or repeated.
 */
export function chooseExercises(exercises: Exercise[], ids: string[]): Exercise[] {
  const byId = new Map(exercises.filter((e) => !e.archived).map((e) => [e.id, e]))
  const seen = new Set<string>()
  const picked: Exercise[] = []
  for (const id of ids) {
    const exercise = byId.get(id)
    if (!exercise || seen.has(id)) continue
    seen.add(id)
    picked.push(exercise)
  }
  return picked
}

/** Reorders so opposing muscles sit back to back where possible. */
export function orderForAlternation(exercises: Exercise[]): Exercise[] {
  return alternateMuscles(exercises, muscleFor)
}

/** Most recent done entry for an exercise, for "last time" hints and prefill. */
export function lastResult(
  exerciseId: string,
  workouts: Workout[],
): { entry: WorkoutEntry; date: string } | undefined {
  const sorted = [...workouts].sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))
  for (const w of sorted) {
    const entry = w.entries.find((e) => e.exerciseId === exerciseId && e.status === 'done')
    if (entry) return { entry, date: w.startedAt }
  }
  return undefined
}
