import { describe, expect, it } from 'vitest'
import { defaultData, validateData } from './storage'

describe('validateData', () => {
  it('round-trips default data', () => {
    const d = defaultData()
    expect(validateData(JSON.parse(JSON.stringify(d)))).toEqual(d)
  })

  it('rejects wrong versions and non-objects', () => {
    expect(() => validateData(null)).toThrow()
    expect(() => validateData({ version: 2, exercises: [], workouts: [] })).toThrow(/version/)
    expect(() => validateData({ version: 1, exercises: 'nope', workouts: [] })).toThrow(/exercises/)
  })

  it('normalizes bad entry statuses and settings', () => {
    const out = validateData({
      version: 1,
      settings: { exercisesPerWorkout: -3 },
      exercises: [{ id: 'a', name: 'A', seatSetting: '', archived: 'yes' }],
      workouts: [{ id: 'w', startedAt: 'x', entries: [{ exerciseId: 'a', status: 'bogus', weight: '5' }] }],
    })
    expect(out.settings.exercisesPerWorkout).toBe(6)
    expect(out.exercises[0]).toEqual({ id: 'a', name: 'A' })
    expect(out.workouts[0].entries[0]).toEqual({ exerciseId: 'a', status: 'pending' })
  })

  it('reports which record is malformed', () => {
    expect(() => validateData({ version: 1, exercises: [{ id: 'a', name: 'A' }, { id: 1 }], workouts: [] })).toThrow(
      /Exercise #2/,
    )
  })
})

describe('validateData duplicate entries', () => {
  it('keeps only the first entry per exercise within a workout', () => {
    const out = validateData({
      version: 1,
      exercises: [{ id: 'a', name: 'A' }],
      workouts: [
        {
          id: 'w',
          startedAt: 'x',
          entries: [
            { exerciseId: 'a', status: 'done', weight: 1 },
            { exerciseId: 'a', status: 'skipped' },
          ],
        },
      ],
    })
    expect(out.workouts[0].entries).toEqual([{ exerciseId: 'a', status: 'done', weight: 1 }])
  })
})
