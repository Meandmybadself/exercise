import { CATALOG, exerciseKey } from './catalog'
import type { Exercise, Workout, WorkoutEntry } from './types'

interface Library {
  exercises: Exercise[]
  workouts: Workout[]
  deduped?: boolean
}

/**
 * Merges exercises that are really the same (see `exerciseKey`) into one, once. The one with
 * the most history survives, past workouts are repointed to it, and a workout that ends up
 * with two entries for it keeps the one you actually did.
 */
export function dedupeLibrary<T extends Library>(data: T): T {
  if (data.deduped) return data

  const groups = new Map<string, Exercise[]>()
  for (const e of data.exercises) {
    const key = exerciseKey(e.name)
    groups.set(key, [...(groups.get(key) ?? []), e])
  }

  const uses = (id: string) => data.workouts.reduce((n, w) => n + w.entries.filter((en) => en.exerciseId === id).length, 0)
  const remap = new Map<string, string>()
  const kept = new Map<string, Exercise>()

  for (const [key, members] of groups) {
    const primary = members.reduce((best, e) => (uses(e.id) > uses(best.id) ? e : best), members[0])
    if (members.length === 1) {
      kept.set(primary.id, primary)
      continue
    }
    const catalogName = CATALOG.find((c) => exerciseKey(c.name) === key)?.name
    const seat = members.find((m) => m.seatSetting)?.seatSetting
    const muscle = primary.muscle ?? members.find((m) => m.muscle)?.muscle
    const merged: Exercise = {
      id: primary.id,
      name: catalogName ?? primary.name,
      ...(primary.seatSetting ?? seat ? { seatSetting: primary.seatSetting ?? seat } : {}),
      ...(muscle ? { muscle } : {}),
      ...(members.every((m) => m.archived) ? { archived: true } : {}),
    }
    kept.set(primary.id, merged)
    for (const m of members) remap.set(m.id, primary.id)
  }

  const workouts = data.workouts.map((w) => {
    if (!w.entries.some((en) => remap.has(en.exerciseId))) return w
    const byExercise = new Map<string, WorkoutEntry>()
    for (const en of w.entries) {
      const entry = remap.has(en.exerciseId) ? { ...en, exerciseId: remap.get(en.exerciseId)! } : en
      const existing = byExercise.get(entry.exerciseId)
      if (!existing) byExercise.set(entry.exerciseId, entry)
      else {
        const winner = existing.status !== 'done' && entry.status === 'done' ? entry : existing
        const loser = winner === existing ? entry : existing
        byExercise.set(entry.exerciseId, { ...winner, ...(winner.note || !loser.note ? {} : { note: loser.note }) })
      }
    }
    return { ...w, entries: [...byExercise.values()] }
  })

  return { ...data, exercises: [...kept.values()], workouts, deduped: true }
}
