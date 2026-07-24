import assert from 'node:assert/strict'
import test from 'node:test'
import { createRestTimer, extendRestTimer, formatRestTime, normalizeRestTimer, pauseRestTimer, remainingRestSeconds, resumeRestTimer, skipRestTimer } from '../src/restTimerEngine.js'

test('timer starts when completing a set', () => {
  const now = 1_000_000
  const timer = createRestTimer(90, now)
  assert.equal(timer.durationSeconds, 90)
  assert.equal(timer.endsAt, now + 90_000)
  assert.equal(timer.status, 'running')
})

test('remaining time is derived from endsAt', () => {
  const timer = createRestTimer(90, 1_000_000)
  assert.equal(remainingRestSeconds(timer, 1_030_000), 60)
  assert.equal(formatRestTime(remainingRestSeconds(timer, 1_030_000)), '1:00')
})

test('timer restores correctly after interruption', () => {
  const persisted = { durationSeconds: 120, endsAt: 1_120_000, status: 'running' }
  const restored = normalizeRestTimer(persisted, 1_075_000)
  assert.equal(restored.status, 'running')
  assert.equal(remainingRestSeconds(restored, 1_075_000), 45)
})

test('expired timer becomes completed', () => {
  const timer = normalizeRestTimer({ durationSeconds: 30, endsAt: 1_030_000, status: 'running' }, 1_031_000)
  assert.equal(timer.status, 'completed')
  assert.equal(remainingRestSeconds(timer, 1_031_000), 0)
})

test('pause and resume retains correct remaining duration', () => {
  const paused = pauseRestTimer(createRestTimer(90, 1_000_000), 1_025_000)
  assert.equal(paused.status, 'paused')
  assert.equal(paused.remainingSeconds, 65)
  const resumed = resumeRestTimer(paused, 1_040_000)
  assert.equal(resumed.status, 'running')
  assert.equal(resumed.endsAt, 1_105_000)
  assert.equal(remainingRestSeconds(resumed, 1_070_000), 35)
})

test('extend adds 30 seconds', () => {
  const extended = extendRestTimer(createRestTimer(60, 1_000_000), 30, 1_020_000)
  assert.equal(remainingRestSeconds(extended, 1_020_000), 70)
})

test('skip completes the timer', () => {
  const skipped = skipRestTimer(createRestTimer(60, 1_000_000), 1_010_000)
  assert.equal(skipped.status, 'completed')
  assert.equal(remainingRestSeconds(skipped, 1_010_000), 0)
})

test('invalid timer values remain safe', () => {
  const timer = normalizeRestTimer({ durationSeconds: Number.NaN, endsAt: Number.NaN, status: 'running', remainingSeconds: -10 }, 1_000_000)
  assert.equal(timer.status, 'completed')
  assert.equal(remainingRestSeconds(timer, 1_000_000), 0)
  assert.equal(formatRestTime(Number.NaN), '0:00')
})
