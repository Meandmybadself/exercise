import { exerciseKey, inferMuscle } from './catalog'
import { alternateMuscles, muscleOf, musclesOppose } from './muscles'
import type { Exercise, MuscleGroup, Workout, WorkoutEntry } from './types'

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
  // One entry per exercise, even if the library holds the same one under two names.
  const seenKeys = new Set<string>()
  const pool = exercises.filter((e) => {
    const key = exerciseKey(e.name)
    if (e.archived || seenKeys.has(key)) return false
    seenKeys.add(key)
    return true
  })
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

/** What to steer a suggestion by: "smart" (opposite of the last exercise) or one muscle group. */
export type SuggestFilter = 'smart' | MuscleGroup

export interface Suggestion {
  exercise: Exercise
  /** Set when this is suggested because it works the opposite muscle to the previous exercise. */
  opposes?: MuscleGroup
  /** Milliseconds since it was last done; Infinity if never. */
  msSince: number
}

/**
 * Exercises worth doing next, best first, skipping anything already in the workout (under any
 * name). "Smart" puts exercises opposing the last one's muscle ahead of the rest. Within a
 * group the order is a weighted shuffle favoring what hasn't been done in a while.
 */
export function suggestOrder(
  exercises: Exercise[],
  workouts: Workout[],
  entries: WorkoutEntry[],
  filter: SuggestFilter,
  random: () => number = Math.random,
): Suggestion[] {
  const byId = new Map(exercises.map((e) => [e.id, e]))
  const inWorkout = new Set(entries.map((en) => exerciseKey(byId.get(en.exerciseId)?.name ?? en.exerciseId)))
  const candidates = exercises.filter((e) => !e.archived && !inWorkout.has(exerciseKey(e.name)))
  const lastExercise = byId.get(entries.at(-1)?.exerciseId ?? '')
  const lastMuscle = lastExercise && muscleFor(lastExercise)

  const order = (group: Exercise[]) => pickExercises(group, workouts, group.length, random)
  const make = (exercise: Exercise, opposes?: MuscleGroup): Suggestion => ({
    exercise,
    ...(opposes ? { opposes } : {}),
    msSince: msSinceLastDone(exercise.id, workouts),
  })

  if (filter !== 'smart') {
    return order(candidates.filter((e) => muscleFor(e) === filter)).map((e) => make(e))
  }
  const opposing = candidates.filter((e) => musclesOppose(lastMuscle, muscleFor(e)))
  const rest = candidates.filter((e) => !opposing.includes(e))
  return [...order(opposing).map((e) => make(e, lastMuscle)), ...order(rest).map((e) => make(e))]
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
