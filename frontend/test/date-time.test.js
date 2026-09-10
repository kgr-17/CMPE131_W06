import assert from 'node:assert/strict'
import test from 'node:test'
import { englishDate, englishTime, formatDateInput, formatSchedule, parseDateInput, toUtcTimestamp } from '../src/date-time.js'

process.env.TZ = 'America/Los_Angeles'

test('uses English date and time formatting regardless of the browser locale', () => {
  assert.equal(englishDate.resolvedOptions().locale, 'en-US')
  assert.equal(englishTime.resolvedOptions().locale, 'en-US')
  assert.match(formatSchedule('2026-09-10T02:00:00Z', '2026-09-10T03:00:00Z'), /Sep .*2026 at .* – /)
  assert.doesNotMatch(formatSchedule('2026-09-10T02:00:00Z'), /[\u3400-\u9fff]/)
})

test('converts local calendar dates and times to UTC', () => {
  assert.equal(toUtcTimestamp('09/09/2026', '19:00'), '2026-09-10T02:00:00.000Z')
  assert.equal(toUtcTimestamp('12/09/2026', '19:00'), '2026-12-10T03:00:00.000Z')
})

test('validates actual calendar dates, including leap years', () => {
  assert.equal(formatDateInput(parseDateInput('02/29/2028')), '02/29/2028')
  for (const value of ['02/29/2026', '02/30/2026', '13/01/2026', '00/10/2026', '09/00/2026', '9/9/2026', 'invalid']) {
    assert.equal(parseDateInput(value), null)
  }
})

test('rejects invalid times and daylight-saving gaps', () => {
  for (const value of ['24:00', '09:60', '9:00', 'abc', '']) {
    assert.equal(toUtcTimestamp('09/09/2026', value), null)
  }
  assert.equal(toUtcTimestamp('03/08/2026', '02:30'), null)
})

test('includes both dates for an overnight task', () => {
  assert.match(formatSchedule('2026-09-09T12:00:00Z', '2026-09-11T12:00:00Z'), /Sep 9, 2026.*Sep 11, 2026/)
})
