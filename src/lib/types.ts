export type EntryStatus = 'pending' | 'done' | 'skipped'

export interface Exercise {
  id: string
  name: string
  /** Optional machine seat/back setting, e.g. "Seat 4, back 2". */
  seatSetting?: string
  /** Archived exercises are hidden from selection but keep their history. */
  archived?: boolean
}

export interface WorkoutEntry {
  exerciseId: string
  weight?: number
  reps?: number
  status: EntryStatus
}

export interface Workout {
  id: string
  startedAt: string
  finishedAt?: string
  entries: WorkoutEntry[]
}

export interface Settings {
  exercisesPerWorkout: number
}

export interface AppData {
  version: 1
  settings: Settings
  exercises: Exercise[]
  workouts: Workout[]
}
