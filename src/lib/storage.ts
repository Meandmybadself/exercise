import type { AppData, EntryStatus, Exercise, Workout } from './types'

export const STORAGE_KEY = 'exercise:data'

const SEED_EXERCISES: Exercise[] = [
  'Naut. Nitro Adductor',
  'Hammer Incline Press',
  'MedX Pullover',
  'MedX Torso Arm - Sup.',
  'Naut. Nitro Abdominals',
  'Naut. Nitro Abductor',
].map((name) => ({ id: newId(), name }))

export function newId(): string {
  return crypto.randomUUID()
}

export function defaultData(): AppData {
  return {
    version: 1,
    settings: { exercisesPerWorkout: 6 },
    exercises: SEED_EXERCISES,
    workouts: [],
  }
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultData()
    return validateData(JSON.parse(raw))
  } catch {
    return defaultData()
  }
}

/** Returns false if the browser refused the write (quota exceeded, private mode). */
export function saveData(data: AppData): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

export function activeExercises(exercises: Exercise[]): Exercise[] {
  return exercises.filter((e) => !e.archived)
}

/**
 * Validates an untrusted object (from storage or an import file) and returns
 * a well-formed AppData. Throws with a readable message on failure.
 */
export function validateData(input: unknown): AppData {
  if (!isRecord(input)) throw new Error('Data must be an object')
  if (input.version !== 1) throw new Error(`Unsupported data version: ${String(input.version)}`)
  if (!Array.isArray(input.exercises)) throw new Error('Missing exercises list')
  if (!Array.isArray(input.workouts)) throw new Error('Missing workouts list')

  const exercises: Exercise[] = input.exercises.map((e, i) => {
    if (!isRecord(e) || typeof e.id !== 'string' || typeof e.name !== 'string') {
      throw new Error(`Exercise #${i + 1} is malformed`)
    }
    return {
      id: e.id,
      name: e.name,
      ...(typeof e.seatSetting === 'string' && e.seatSetting ? { seatSetting: e.seatSetting } : {}),
      ...(e.archived === true ? { archived: true } : {}),
    }
  })

  const workouts: Workout[] = input.workouts.map((w, i) => {
    if (!isRecord(w) || typeof w.id !== 'string' || typeof w.startedAt !== 'string' || !Array.isArray(w.entries)) {
      throw new Error(`Workout #${i + 1} is malformed`)
    }
    return {
      id: w.id,
      startedAt: w.startedAt,
      ...(typeof w.finishedAt === 'string' ? { finishedAt: w.finishedAt } : {}),
      entries: dedupeByExercise(w.entries).map((en, j) => {
        if (!isRecord(en) || typeof en.exerciseId !== 'string') {
          throw new Error(`Workout #${i + 1}, entry #${j + 1} is malformed`)
        }
        const status: EntryStatus = en.status === 'done' || en.status === 'skipped' ? en.status : 'pending'
        return {
          exerciseId: en.exerciseId,
          status,
          ...(typeof en.weight === 'number' ? { weight: en.weight } : {}),
          ...(typeof en.reps === 'number' ? { reps: en.reps } : {}),
        }
      }),
    }
  })

  const settings = isRecord(input.settings) ? input.settings : {}
  const count = Number(settings.exercisesPerWorkout)
  return {
    version: 1,
    settings: { exercisesPerWorkout: Number.isInteger(count) && count > 0 ? count : 6 },
    exercises,
    workouts,
  }
}

/** Entries are addressed by exerciseId, so a workout can only hold one per exercise. */
function dedupeByExercise(entries: unknown[]): unknown[] {
  const seen = new Set<string>()
  return entries.filter((en) => {
    const id = isRecord(en) ? en.exerciseId : undefined
    if (typeof id !== 'string' || seen.has(id)) return typeof id !== 'string'
    seen.add(id)
    return true
  })
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}
