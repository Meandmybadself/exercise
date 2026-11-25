import { describe, expect, it } from 'vitest'
import { calendarDaysAgo, numberText, parseNumber, relativeDays } from './format'

describe('parseNumber', () => {
  it('reads numbers, including decimals', () => {
    expect(parseNumber('12')).toBe(12)
    expect(parseNumber('62.5')).toBe(62.5)
    expect(parseNumber('0')).toBe(0)
  })
  it('treats empty and junk as no value', () => {
    expect(parseNumber('')).toBeUndefined()
    expect(parseNumber('  ')).toBeUndefined()
    expect(parseNumber('abc')).toBeUndefined()
  })
})

describe('numberText', () => {
  it('round-trips', () => {
    expect(numberText(undefined)).toBe('')
    expect(numberText(10)).toBe('10')
    expect(parseNumber(numberText(7.5))).toBe(7.5)
  })
})

describe('relativeDays', () => {
  // Local-time dates, so the test holds in any timezone.
  const at = (y: number, m: number, d: number, h: number, min = 0) => new Date(y, m - 1, d, h, min)
  const rel = (then: Date, now: Date) => relativeDays(then.toISOString(), now.getTime())

  it('counts calendar days, not 24-hour blocks', () => {
    // 9pm two days ago, checked at 9am: only 36 hours, but two calendar days.
    expect(rel(at(2026, 11, 23, 21), at(2026, 11, 25, 9))).toBe('2 days ago')
    expect(calendarDaysAgo(at(2026, 11, 23, 21).toISOString(), at(2026, 11, 25, 9).getTime())).toBe(2)
  })
  it('says yesterday for any time on the previous calendar day', () => {
    expect(rel(at(2026, 11, 24, 0, 5), at(2026, 11, 25, 23, 55))).toBe('yesterday')
    expect(rel(at(2026, 11, 24, 23, 55), at(2026, 11, 25, 0, 5))).toBe('yesterday')
  })
  it('says today for earlier the same day, even over 24h-ish boundaries', () => {
    expect(rel(at(2026, 11, 25, 0, 1), at(2026, 11, 25, 23, 59))).toBe('today')
  })
  it('handles month and year boundaries and clock skew', () => {
    expect(rel(at(2026, 12, 31, 12), at(2027, 1, 2, 8))).toBe('2 days ago')
    expect(rel(at(2026, 11, 26, 12), at(2026, 11, 25, 8))).toBe('today')
  })
})
