import { describe, expect, it } from 'vitest'
import { numberText, parseNumber } from './format'

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
