import { describe, expect, it } from 'vitest'
import { CATALOG, catalogKey, inferMuscle, isSameMachine, syncCatalog } from './catalog'
import type { Exercise } from './types'

let n = 0
const id = () => `new-${n++}`
const ex = (name: string, muscle?: Exercise['muscle']): Exercise => ({ id: name, name, ...(muscle ? { muscle } : {}) })

describe('isSameMachine', () => {
  it('ignores case and punctuation', () => {
    expect(isSameMachine('hammer incline press', 'Hammer Incline Press')).toBe(true)
    expect(isSameMachine('Naut. Nitro Adductor', 'Naut Nitro Adductor')).toBe(true)
  })
  it('treats a brandless name as the same machine, and spelling variants of a brand as the same', () => {
    expect(isSameMachine('Hack Squat', 'Hammer Hack Squat')).toBe(true)
    expect(isSameMachine('Hammer Strength Hack Squat', 'Hammer Hack Squat')).toBe(true)
  })
  it('treats a different brand as a different machine', () => {
    expect(isSameMachine('Hoist Biceps Curl', 'Life Fitness Biceps Curl')).toBe(false)
    expect(isSameMachine('Naut. Nitro Adductor', 'Life Fitness Hip Adduction')).toBe(false)
  })
})

describe('inferMuscle', () => {
  it.each([
    ['Seated Leg Curl', 'hamstrings'],
    ['Leg Extension', 'quads'],
    ['Cable Row', 'back'],
    ['Lat Pulldown', 'back'],
    ['Preacher Curl', 'biceps'],
    ['Tricep Pushdown', 'triceps'],
    ['Pec Fly', 'chest'],
    ['Overhead Press', 'shoulders'],
    ['Hip Abductor', 'abductors'],
    ['Cable Crunch', 'core'],
  ])('%s → %s', (name, muscle) => expect(inferMuscle(name)).toBe(muscle))

  it('returns undefined for names it cannot place', () => {
    expect(inferMuscle('Mystery Machine')).toBeUndefined()
  })
})

describe('syncCatalog', () => {
  it('adds only machines the library lacks and classifies the rest', () => {
    const out = syncCatalog({ exercises: [ex('Hammer Incline Press'), ex('Leg Extension'), ex('Mystery')] }, id)
    const names = out.exercises.map((e) => e.name)
    expect(names.filter((x) => x === 'Hammer Incline Press')).toHaveLength(1)
    // A generic "Leg Extension" already stands in for every brand of it.
    expect(names).not.toContain('Hoist Leg Extension')
    expect(names).not.toContain('Technogym Leg Extension')
    expect(names).toContain('Life Fitness Seated Leg Press')
    expect(out.exercises.find((e) => e.name === 'Hammer Incline Press')?.muscle).toBe('chest')
    expect(out.exercises.find((e) => e.name === 'Leg Extension')?.muscle).toBe('quads')
    expect(out.exercises.find((e) => e.name === 'Mystery')?.muscle).toBeUndefined()
  })

  it('never overwrites a muscle the user chose', () => {
    const out = syncCatalog({ exercises: [ex('Hammer Incline Press', 'shoulders')] }, id)
    expect(out.exercises.find((e) => e.name === 'Hammer Incline Press')?.muscle).toBe('shoulders')
  })

  it('does not re-add a machine the user removed after the first sync', () => {
    const first = syncCatalog({ exercises: [] as Exercise[] }, id)
    const trimmed = { ...first, exercises: first.exercises.filter((e) => e.name !== 'Hoist Mid Row') }
    expect(syncCatalog(trimmed, id).exercises.map((e) => e.name)).not.toContain('Hoist Mid Row')
  })

  it('is a no-op once synced', () => {
    const first = syncCatalog({ exercises: [] as Exercise[] }, id)
    expect(first.exercises).toHaveLength(CATALOG.length)
    expect(syncCatalog(first, id)).toBe(first)
    expect((first as { catalogSynced?: string[] }).catalogSynced).toContain(catalogKey('Hoist Mid Row'))
  })
})
