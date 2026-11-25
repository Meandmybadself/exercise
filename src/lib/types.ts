export type EntryStatus = 'pending' | 'done' | 'skipped'

export type MuscleGroup =
  | 'chest'
  | 'shoulders'
  | 'triceps'
  | 'back'
  | 'biceps'
  | 'quads'
  | 'hamstrings'
  | 'adductors'
  | 'abductors'
  | 'core'

export interface Exercise {
  id: string
  name: string
  /** Optional machine seat/back setting, e.g. "Seat 4, back 2". */
  seatSetting?: string
  /** Main muscle worked; used to put opposing muscles back to back. */
  muscle?: MuscleGroup
  /** Archived exercises are hidden from selection but keep their history. */
  archived?: boolean
}

export interface WorkoutEntry {
  exerciseId: string
  weight?: number
  reps?: number
  /** Free-form note about how the set felt, form cues, settings used, etc. */
  note?: string
  status: EntryStatus
}

export interface Workout {
  id: string
  startedAt: string
  finishedAt?: string
  entries: WorkoutEntry[]
}

export type Theme = 'system' | 'light' | 'dark'

export interface Settings {
  exercisesPerWorkout: number
  theme: Theme
}

export interface AppData {
  version: 1
  settings: Settings
  exercises: Exercise[]
  workouts: Workout[]
  /** Catalog machines already offered to this library, so removed ones aren't re-added. */
  catalogSynced?: string[]
  /** Set once brand names have been removed from exercise names. */
  brandsStripped?: boolean
  /** Set once duplicate exercises have been merged. */
  deduped?: boolean
}
