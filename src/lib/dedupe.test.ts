import { describe, expect, it } from 'vitest'
import { dedupeLibrary } from './dedupe'
import { pickExercises } from './planner'
import type { Exercise, Workout } from './types'

const ex = (id: string, name: string, extra: Partial<Exercise> = {}): Exercise => ({ id, name, ...extra })
const w = (id: string, entries: Workout['entries']): Workout => ({ id, startedAt: '2026-01-01T00:00:00Z', finishedAt: '2026-01-01T01:00:00Z', entries })

describe('dedupeLibrary', () => {
  it('merges Seated Leg Press into Leg Press, keeping the one with history and repointing workouts', () => {
    const out = dedupeLibrary({
      exercises: [ex('a', 'Seated Leg Press'), ex('b', 'Leg Press', { seatSetting: '4' }), ex('c', 'Hack Squat')],
      workouts: [w('w1', [{ exerciseId: 'a', status: 'done', weight: 100, reps: 10 }]), w('w2', [{ exerciseId: 'b', status: 'done', weight: 90 }, { exerciseId: 'c', status: 'done' }])],
    })
    expect(out.exercises.map((e) => e.name)).toEqual(['Leg Press', 'Hack Squat'])
    const lp = out.exercises[0]
    expect(lp.seatSetting).toBe('4')
    expect(out.workouts.flatMap((x) => x.entries).filter((e) => e.exerciseId === lp.id)).toHaveLength(2)
    expect(out.workouts.flatMap((x) => x.entries).every((e) => out.exercises.some((x) => x.id === e.exerciseId))).toBe(true)
  })

  it('merges same-name exercises and spelling variants', () => {
    const out = dedupeLibrary({ exercises: [ex('a', 'Biceps Curl'), ex('b', 'Bicep Curl'), ex('c', 'Hip Adduction'), ex('d', 'Adductor')], workouts: [] })
    expect(out.exercises.map((e) => e.name)).toEqual(['Biceps Curl', 'Adductor'])
  })

  it('collapses two entries for one exercise within a workout, keeping the one that was done and its note', () => {
    const out = dedupeLibrary({
      exercises: [ex('a', 'Seated Leg Press'), ex('b', 'Leg Press')],
      workouts: [w('w1', [{ exerciseId: 'a', status: 'skipped', note: 'sore knee' }, { exerciseId: 'b', status: 'done', weight: 50 }])],
    })
    expect(out.workouts[0].entries).toEqual([{ exerciseId: out.exercises[0].id, status: 'done', weight: 50, note: 'sore knee' }])
  })

  it('is a no-op once done and when nothing is duplicated', () => {
    const lib = { exercises: [ex('a', 'Leg Press'), ex('b', 'Seated Leg Press')], workouts: [], deduped: true }
    expect(dedupeLibrary(lib)).toBe(lib)
    const clean = dedupeLibrary({ exercises: [ex('a', 'Seated Leg Curl'), ex('b', 'Prone Leg Curl')], workouts: [] })
    expect(clean.exercises).toHaveLength(2)
  })
})

describe('one entry per exercise in a workout', () => {
  const dupes = [ex('a', 'Seated Leg Press'), ex('b', 'Leg Press'), ex('c', 'Hack Squat')]
  it('random picks never include two names for the same exercise', () => {
    for (let i = 0; i < 30; i++) {
      const names = pickExercises(dupes, [], 3).map((e) => e.name)
      expect(names).toHaveLength(2)
      expect(names.filter((n) => n.includes('Leg Press'))).toHaveLength(1)
    }
  })
})
