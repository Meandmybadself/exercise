import type { Exercise, MuscleGroup } from './types'

/**
 * Each muscle sits on one side of an axis. Two muscles oppose each other when they
 * share an axis but sit on different sides (push/pull, quads/hamstrings, ...).
 * Core has no opposite.
 */
const MUSCLES: Record<MuscleGroup, { label: string; axis: string; side: 0 | 1 }> = {
  chest: { label: 'Chest', axis: 'upper', side: 0 },
  shoulders: { label: 'Shoulders', axis: 'upper', side: 0 },
  triceps: { label: 'Triceps', axis: 'upper', side: 0 },
  back: { label: 'Back', axis: 'upper', side: 1 },
  biceps: { label: 'Biceps', axis: 'upper', side: 1 },
  quads: { label: 'Quads', axis: 'legs', side: 0 },
  hamstrings: { label: 'Hamstrings', axis: 'legs', side: 1 },
  adductors: { label: 'Adductors', axis: 'hips', side: 0 },
  abductors: { label: 'Abductors', axis: 'hips', side: 1 },
  core: { label: 'Core', axis: 'core', side: 0 },
}

export const MUSCLE_GROUPS = Object.keys(MUSCLES) as MuscleGroup[]

export function muscleLabel(muscle: MuscleGroup): string {
  return MUSCLES[muscle].label
}

export function isMuscleGroup(v: unknown): v is MuscleGroup {
  return typeof v === 'string' && v in MUSCLES
}

export function musclesOppose(a: MuscleGroup | undefined, b: MuscleGroup | undefined): boolean {
  if (!a || !b) return false
  const x = MUSCLES[a]
  const y = MUSCLES[b]
  return x.axis === y.axis && x.axis !== 'core' && x.side !== y.side
}

/** Muscle for an exercise: its own setting, else inferred from a catalog entry of the same name. */
export function muscleOf(exercise: Exercise, lookup: (name: string) => MuscleGroup | undefined): MuscleGroup | undefined {
  return exercise.muscle ?? lookup(exercise.name)
}

/**
 * Reorders exercises so each one is followed by an opposing muscle where possible.
 * Greedy and stable: keeps the given order except to pull in the next opposing exercise.
 */
export function alternateMuscles<T>(items: T[], muscle: (item: T) => MuscleGroup | undefined): T[] {
  const rest = [...items]
  const out: T[] = []
  while (rest.length > 0) {
    const prev = out.at(-1)
    const i = prev === undefined ? 0 : Math.max(0, rest.findIndex((x) => musclesOppose(muscle(prev), muscle(x))))
    out.push(rest.splice(i, 1)[0])
  }
  return out
}
