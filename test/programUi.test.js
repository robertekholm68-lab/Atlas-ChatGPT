import assert from 'node:assert/strict'
import test from 'node:test'
import { access } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { defaultPrograms, exerciseBank } from '../src/programCatalog.js'

const root = dirname(dirname(fileURLToPath(import.meta.url)))

test('approved Program UI data keeps unique programs and valid exercise references', () => {
  const programIds = new Set(defaultPrograms.map(program => program.id))
  const exerciseIds = new Set(exerciseBank.map(exercise => exercise.id))

  assert.equal(programIds.size, defaultPrograms.length)
  for (const program of defaultPrograms) {
    assert.ok(program.name)
    assert.ok(program.type)
    assert.ok(program.exercises.length >= 3)
    assert.deepEqual([...new Set(program.exercises)], program.exercises)
    for (const exerciseId of program.exercises) assert.ok(exerciseIds.has(exerciseId), `${program.id} references ${exerciseId}`)
  }
})

test('approved Program UI visual assets remain available for featured programs', async () => {
  const featuredPrograms = defaultPrograms.filter(program => program.favorite)
  assert.ok(featuredPrograms.length >= 2)

  for (const program of featuredPrograms) {
    assert.ok(program.cover, `${program.id} should keep its program cover`)
    assert.ok(program.muscleFigure, `${program.id} should keep its muscle figure`)
    await access(join(root, 'public', program.cover.replace(/^\//, '')))
    await access(join(root, 'public', program.muscleFigure.replace(/^\//, '')))
  }
})
