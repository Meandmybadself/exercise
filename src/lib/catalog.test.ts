import { describe, expect, it } from 'vitest'
import { CATALOG, catalogKey, inferMuscle, isSameMachine, stripBrand, syncCatalog } from './catalog'
import type { Exercise } from './types'

let n = 0
const id = () => `new-${n++}`
const ex = (name: string, muscle?: Exercise['muscle']): Exercise => ({ id: name, name, ...(muscle ? { muscle } : {}) })

describe('isSameMachine', () => {
  it('ignores case and punctuation', () => {
    expect(isSameMachine('incline press', 'Incline Press')).toBe(true)
    expect(isSameMachine('Torso Arm Sup', 'Torso Arm - Sup.')).toBe(true)
  })
  it('ignores brand words', () => {
    expect(isSameMachine('Hammer Strength Hack Squat', 'Hack Squat')).toBe(true)
    expect(isSameMachine('Naut. Nitro Adductor', 'Adductor')).toBe(true)
    expect(isSameMachine('Hoist ROC-IT Biceps Curl', 'Biceps Curl')).toBe(true)
  })
  it('folds alternate names together', () => {
    expect(isSameMachine('Seated Leg Press', 'Leg Press')).toBe(true)
    expect(isSameMachine('Hip Adduction', 'Adductor')).toBe(true)
    expect(isSameMachine('Bicep Curl', 'Hoist Biceps Curl')).toBe(true)
  })
  it('keeps distinct exercises apart', () => {
    expect(isSameMachine('Seated Leg Curl', 'Prone Leg Curl')).toBe(false)
    expect(isSameMachine('Hack Squat', 'Squat')).toBe(false)
  })
})

describe('stripBrand', () => {
  it.each([
    ['Naut. Nitro Adductor', 'Adductor'],
    ['Hammer Incline Press', 'Incline Press'],
    ['MedX Torso Arm - Sup.', 'Torso Arm - Sup.'],
    ['Hoist ROC-IT Biceps Curl', 'Biceps Curl'],
    ['Life Fitness Seated Row', 'Seated Row'],
    ['Cable Row', 'Cable Row'],
    ['Hammer', 'Hammer'],
  ])('%s → %s', (name, out) => expect(stripBrand(name)).toBe(out))
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
  it('drops brands from existing names, keeping ids, and adds only missing machines', () => {
    const out = syncCatalog(
      { exercises: [ex('Hammer Incline Press'), ex('Naut. Nitro Adductor'), ex('Leg Extension'), ex('Mystery')] },
      id,
    )
    const names = out.exercises.map((e) => e.name)
    expect(names).toContain('Incline Press')
    expect(names).toContain('Adductor')
    expect(names.filter((x) => x === 'Leg Extension')).toHaveLength(1)
    expect(names).toContain('Leg Press')
    expect(out.exercises.find((e) => e.name === 'Incline Press')?.id).toBe('Hammer Incline Press')
    expect(out.exercises.find((e) => e.name === 'Incline Press')?.muscle).toBe('chest')
    expect(out.exercises.find((e) => e.name === 'Leg Extension')?.muscle).toBe('quads')
    expect(out.exercises.find((e) => e.name === 'Mystery')?.muscle).toBeUndefined()
  })

  it('never overwrites a muscle the user chose', () => {
    const out = syncCatalog({ exercises: [ex('Hammer Incline Press', 'shoulders')] }, id)
    expect(out.exercises.find((e) => e.name === 'Incline Press')?.muscle).toBe('shoulders')
  })

  it('leaves names alone once brands have been stripped', () => {
    const out = syncCatalog({ exercises: [ex('Hoist Special')], brandsStripped: true }, id)
    expect(out.exercises.map((e) => e.name)).toContain('Hoist Special')
  })

  it('does not re-add a machine the user removed after the first sync', () => {
    const first = syncCatalog({ exercises: [] as Exercise[] }, id)
    const trimmed = { ...first, exercises: first.exercises.filter((e) => e.name !== 'Mid Row') }
    expect(syncCatalog(trimmed, id).exercises.map((e) => e.name)).not.toContain('Mid Row')
  })

  it('is a no-op once synced', () => {
    const first = syncCatalog({ exercises: [] as Exercise[] }, id)
    expect(first.exercises).toHaveLength(CATALOG.length)
    expect(syncCatalog(first, id)).toBe(first)
    expect((first as { catalogSynced?: string[] }).catalogSynced).toContain(catalogKey('Mid Row'))
  })
})
