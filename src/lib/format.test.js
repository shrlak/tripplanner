import { describe, it, expect } from 'vitest'
import { fmtDuration, fmtDistance, fmtDateTime, fmtTime, fmtDayLabel, fmtDayShort, fmtTemp, fmtMoney, clamp } from './format.js'

const local = (y, m, d, h = 0, mi = 0) => new Date(y, m, d, h, mi, 0, 0).toISOString()

describe('fmtDuration', () => {
  it('handles missing values', () => {
    expect(fmtDuration(undefined)).toBe('—')
    expect(fmtDuration(NaN)).toBe('—')
  })
  it('formats minutes only', () => {
    expect(fmtDuration(90)).toBe('2 min')
  })
  it('formats whole hours', () => {
    expect(fmtDuration(3600)).toBe('1 hr')
  })
  it('formats hours and minutes', () => {
    expect(fmtDuration(5400)).toBe('1 hr 30 min')
  })
})

describe('fmtDistance', () => {
  it('handles missing values', () => {
    expect(fmtDistance(NaN)).toBe('—')
  })
  it('formats miles under 100 with one decimal', () => {
    expect(fmtDistance(1609.344)).toBe('1.0 mi')
  })
  it('rounds miles at or above 100', () => {
    expect(fmtDistance(160934.4)).toBe('100 mi')
  })
  it('formats kilometers when requested', () => {
    expect(fmtDistance(1000, 'km')).toBe('1.0 km')
  })
})

describe('date/time formatting', () => {
  it('fmtDateTime formats month/day and 12-hour time', () => {
    expect(fmtDateTime(local(2026, 6, 20, 9, 5))).toBe('7/20 09:05 AM')
  })
  it('fmtTime formats 12-hour time only', () => {
    expect(fmtTime(local(2026, 6, 20, 13, 30))).toBe('01:30 PM')
  })
  it('fmtDateTime/fmtTime handle missing values', () => {
    expect(fmtDateTime(null)).toBe('—')
    expect(fmtTime(null)).toBe('—')
  })
  it('fmtDayLabel uppercases weekday + date', () => {
    // 2026-07-20 is a Monday (confirmed against the app's own "today" clock).
    expect(fmtDayLabel(local(2026, 6, 20))).toBe('MON 7/20')
  })
  it('fmtDayShort uppercases the weekday only', () => {
    expect(fmtDayShort(local(2026, 6, 19))).toBe('SUN')
  })
})

describe('fmtTemp', () => {
  it('handles missing values', () => {
    expect(fmtTemp(NaN)).toBe('—')
  })
  it('rounds and appends the unit', () => {
    expect(fmtTemp(72.4, 'F')).toBe('72 F')
    expect(fmtTemp(-1.6, 'C')).toBe('-2 C')
  })
})

describe('fmtMoney', () => {
  it('handles missing values', () => {
    expect(fmtMoney(NaN)).toBe('—')
  })
  it('formats as USD currency', () => {
    expect(fmtMoney(1234.5)).toBe('$1,234.50')
  })
})

describe('clamp', () => {
  it('leaves in-range values untouched', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })
  it('clamps below the minimum', () => {
    expect(clamp(-5, 0, 10)).toBe(0)
  })
  it('clamps above the maximum', () => {
    expect(clamp(15, 0, 10)).toBe(10)
  })
})
