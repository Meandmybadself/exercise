import { describe, expect, it } from 'vitest'
import {
  averageDurationMs,
  formatClock,
  formatDuration,
  formatDurationCompact,
  workoutDurationMs,
} from './duration'
import type { Workout } from './types'

function workout(startedAt: string, finishedAt?: string): Workout {
  return { id: 'w', startedAt, ...(finishedAt ? { finishedAt } : {}), entries: [] }
}

describe('workoutDurationMs', () => {
  it('measures a finished workout end to end', () => {
    const w = workout('2026-01-01T10:00:00.000Z', '2026-01-01T10:42:30.000Z')
    expect(workoutDurationMs(w)).toBe(42.5 * 60_000)
  })

  it('measures a running workout against now', () => {
    const now = Date.parse('2026-01-01T10:05:00.000Z')
    expect(workoutDurationMs(workout('2026-01-01T10:00:00.000Z'), now)).toBe(5 * 60_000)
  })

  it('never goes negative when the clock moved backwards', () => {
    const now = Date.parse('2026-01-01T09:00:00.000Z')
    expect(workoutDurationMs(workout('2026-01-01T10:00:00.000Z'), now)).toBe(0)
  })

  it('returns undefined for unparsable timestamps', () => {
    expect(workoutDurationMs(workout('nonsense'))).toBeUndefined()
    expect(workoutDurationMs(workout('2026-01-01T10:00:00.000Z', 'nonsense'))).toBeUndefined()
  })
})

describe('formatClock', () => {
  it('counts minutes and seconds under an hour', () => {
    expect(formatClock(0)).toBe('0:00')
    expect(formatClock(9_000)).toBe('0:09')
    expect(formatClock(12 * 60_000 + 34_000)).toBe('12:34')
  })

  it('adds an hours field past an hour', () => {
    expect(formatClock(3_600_000)).toBe('1:00:00')
    expect(formatClock(3_723_000)).toBe('1:02:03')
  })

  it('clamps negatives to zero', () => {
    expect(formatClock(-5_000)).toBe('0:00')
  })
})

describe('formatDuration', () => {
  it('reads as minutes and hours', () => {
    expect(formatDuration(30_000)).toBe('< 1 min')
    expect(formatDuration(59_999)).toBe('< 1 min')
    expect(formatDuration(60_000)).toBe('1 min')
    expect(formatDuration(48 * 60_000)).toBe('48 min')
    expect(formatDuration(60 * 60_000)).toBe('1h')
    expect(formatDuration(72 * 60_000)).toBe('1h 12m')
  })

  it('has a compact form for stat tiles', () => {
    expect(formatDurationCompact(20_000)).toBe('1m')
    expect(formatDurationCompact(48 * 60_000)).toBe('48m')
    expect(formatDurationCompact(60 * 60_000)).toBe('1h')
    expect(formatDurationCompact(72 * 60_000)).toBe('1h12')
  })
})

describe('averageDurationMs', () => {
  it('averages only finished workouts', () => {
    const workouts = [
      workout('2026-01-01T10:00:00.000Z', '2026-01-01T10:20:00.000Z'),
      workout('2026-01-02T10:00:00.000Z', '2026-01-02T10:40:00.000Z'),
      workout('2026-01-03T10:00:00.000Z'),
    ]
    expect(averageDurationMs(workouts)).toBe(30 * 60_000)
  })

  it('is undefined with nothing finished', () => {
    expect(averageDurationMs([])).toBeUndefined()
    expect(averageDurationMs([workout('2026-01-01T10:00:00.000Z')])).toBeUndefined()
  })
})
