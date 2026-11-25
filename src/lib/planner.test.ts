import { describe, expect, it } from 'vitest'
import { lastResult, orderForAlternation, pickExercises, suggestOrder } from './planner'
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

describe('opposing muscles', () => {
  const m = (id: string, muscle: Exercise['muscle']): Exercise => ({ id, name: id, muscle })
  const library = [m('chest1', 'chest'), m('chest2', 'shoulders'), m('row1', 'back'), m('curl', 'biceps'), m('quad', 'quads'), m('ham', 'hamstrings')]

  it('alternates opposing muscles in random picks', () => {
    const upper = new Set(['chest1', 'chest2', 'row1', 'curl'])
    for (let i = 0; i < 50; i++) {
      const ids = pickExercises(library, [], 6).map((e) => e.id)
      expect(new Set(ids).size).toBe(6)
      // Every opposing partner is available, so each step must switch sides of its axis.
      const side = (id: string) => (id === 'chest1' || id === 'chest2' || id === 'quad' ? 0 : 1)
      for (let k = 1; k < ids.length; k++) {
        const sameAxis = upper.has(ids[k]) === upper.has(ids[k - 1])
        if (sameAxis) expect(side(ids[k])).not.toBe(side(ids[k - 1]))
      }
    }
  })

  it('follows a push with a pull', () => {
    const picked = pickExercises(library.slice(0, 4), [], 2, () => 0).map((e) => e.id)
    expect(picked).toEqual(['chest1', 'row1'])
  })

  it('reorders by alternation without dropping anything', () => {
    const out = orderForAlternation([m('a', 'chest'), m('b', 'shoulders'), m('c', 'back'), m('d', 'triceps'), m('e', 'biceps')])
    expect(out.map((e) => e.id)).toEqual(['a', 'c', 'b', 'e', 'd'])
  })
})

describe('suggestOrder', () => {
  const m = (id: string, muscle: Exercise['muscle'], archived = false): Exercise => ({ id, name: id, muscle, ...(archived ? { archived } : {}) })
  const lib = [m('bench', 'chest'), m('row', 'back'), m('pull', 'back'), m('curl', 'biceps'), m('squat', 'quads'), m('old', 'back', true)]
  const entry = (exerciseId: string) => ({ exerciseId, status: 'done' as const })
  const ids = (xs: { exercise: Exercise }[]) => xs.map((s) => s.exercise.id)

  it('suggests the opposite of the last exercise first, then the rest', () => {
    const out = suggestOrder(lib, [], [entry('bench')], 'smart', () => 0)
    expect(ids(out).slice(0, 3).sort()).toEqual(['curl', 'pull', 'row'])
    expect(out.slice(0, 3).every((s) => s.opposes === 'chest')).toBe(true)
    expect(ids(out).slice(3)).toEqual(['squat'])
    expect(out[3].opposes).toBeUndefined()
  })

  it('never suggests what is already in the workout, archived exercises, or a repeat under another name', () => {
    const out = suggestOrder([...lib, { id: 'bench2', name: 'Bench', muscle: 'chest' }, m('Bench', 'chest')], [], [entry('bench')], 'smart')
    expect(ids(out)).not.toContain('bench')
    expect(ids(out)).not.toContain('old')
    expect(ids(out)).not.toContain('Bench')
  })

  it('filters to one muscle when asked', () => {
    const out = suggestOrder(lib, [], [entry('bench')], 'back', () => 0)
    expect(ids(out).sort()).toEqual(['pull', 'row'])
  })

  it('starts from whatever is stalest when the workout is empty', () => {
    const workouts = [workout('w1', daysAgo(1), ['bench', 'row', 'pull', 'curl'])]
    expect(suggestOrder(lib, workouts, [], 'smart', () => 0.99)[0].exercise.id).toBe('squat')
  })

  it('reports how long since each was done', () => {
    const workouts = [workout('w1', daysAgo(3), ['bench'])]
    const out = suggestOrder(lib, workouts, [entry('row')], 'chest')
    expect(out[0].msSince).toBeGreaterThan(2.9 * 86_400_000)
    expect(suggestOrder(lib, [], [], 'smart')[0].msSince).toBe(Infinity)
  })
})
