import { describe, expect, it } from 'vitest'
import { chooseExercises, lastResult, pickExercises } from './planner'
import type { Exercise, Workout } from './types'

const ex = (id: string, archived = false): Exercise => ({ id, name: id, ...(archived ? { archived } : {}) })
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()
const workout = (id: string, startedAt: string, doneIds: string[], weight = 100): Workout => ({
  id,
  startedAt,
  finishedAt: startedAt,
  entries: doneIds.map((exerciseId) => ({ exerciseId, status: 'done', weight, reps: 10 })),
})

describe('pickExercises', () => {
  const library = [ex('a'), ex('b'), ex('c'), ex('d'), ex('e', true)]

  it('returns the requested count without duplicates', () => {
    const picked = pickExercises(library, [], 3)
    expect(picked).toHaveLength(3)
    expect(new Set(picked.map((e) => e.id)).size).toBe(3)
  })

  it('never picks archived exercises and caps at the pool size', () => {
    const picked = pickExercises(library, [], 10)
    expect(picked.map((e) => e.id).sort()).toEqual(['a', 'b', 'c', 'd'])
  })

  it('favors least-recently-done exercises', () => {
    const workouts = [workout('w1', daysAgo(0), ['a', 'b', 'c'])]
    let dPicks = 0
    const trials = 500
    for (let i = 0; i < trials; i++) {
      if (pickExercises(library, workouts, 1)[0].id === 'd') dPicks++
    }
    // d has weight 61 vs 1 each for a/b/c, so it should win the vast majority of the time.
    expect(dPicks / trials).toBeGreaterThan(0.9)
  })

  it('is deterministic with a fixed random source', () => {
    const rnd = () => 0
    expect(pickExercises(library, [], 2, rnd).map((e) => e.id)).toEqual(['a', 'b'])
  })
})

describe('lastResult', () => {
  it('returns the most recent done entry', () => {
    const workouts = [
      workout('w1', daysAgo(10), ['a'], 100),
      workout('w2', daysAgo(2), ['a'], 110),
      workout('w3', daysAgo(1), ['b'], 50),
    ]
    expect(lastResult('a', workouts)?.entry.weight).toBe(110)
    expect(lastResult('c', workouts)).toBeUndefined()
  })

  it('ignores skipped entries', () => {
    const w: Workout = {
      id: 'w',
      startedAt: daysAgo(1),
      entries: [{ exerciseId: 'a', status: 'skipped' }],
    }
    expect(lastResult('a', [w])).toBeUndefined()
  })
})

describe('chooseExercises', () => {
  const library = [ex('a'), ex('b'), ex('c'), ex('gone', true)]

  it('keeps the order they were picked in', () => {
    expect(chooseExercises(library, ['c', 'a']).map((e) => e.id)).toEqual(['c', 'a'])
  })

  it('drops unknown, archived, and repeated ids', () => {
    expect(chooseExercises(library, ['a', 'nope', 'gone', 'a', 'b']).map((e) => e.id)).toEqual(['a', 'b'])
  })

  it('returns nothing for an empty pick', () => {
    expect(chooseExercises(library, [])).toEqual([])
  })
})
