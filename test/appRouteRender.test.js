import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { cwd } from 'node:process'
import test from 'node:test'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { build } from 'vite'

async function bundle(entry) {
  const outDir = await mkdtemp(join(cwd(), '.tmp-atlas-route-'))
  await build({
    logLevel: 'silent',
    build: {
      ssr: entry,
      outDir,
      emptyOutDir: true
    }
  })
  return { modulePath: `${outDir}/${entry.split('/').pop().replace(/\.jsx$/, '.js')}`, cleanup: () => rm(outDir, { recursive: true, force: true }) }
}

function storageWith(values) {
  return {
    getItem(key) { return Object.hasOwn(values, key) ? values[key] : null },
    setItem() {},
    removeItem() {},
    clear() {}
  }
}

test('intelligence pages render without route-level runtime errors', async () => {
  const { modulePath, cleanup } = await bundle('src/AppIntelligence.jsx')
  try {
    const { default: AppIntelligence } = await import(modulePath)
    for (const page of ['today', 'coach', 'goal', 'recovery', 'decisions', 'settings']) {
      globalThis.localStorage = storageWith({
        'atlas-intelligence-v1': JSON.stringify({ page }),
        'atlas-core-v1': JSON.stringify({ workouts: [], recovery: { muscles: {} }, coach: {} })
      })
      const html = renderToString(React.createElement(AppIntelligence))
      assert.match(html, /ASKR Intelligence|atlas-i-shell/)
      assert.doesNotMatch(html, /undefined|null|NaN/)
    }
  } finally {
    delete globalThis.localStorage
    await cleanup()
  }
})

test('phase 4 primary pages render without route-level runtime errors', async () => {
  const { modulePath, cleanup } = await bundle('src/AppPhase4.jsx')
  try {
    const { default: AppPhase4 } = await import(modulePath)
    for (const page of ['dashboard', 'session', 'food', 'progress', 'recovery', 'coach']) {
      globalThis.localStorage = storageWith({ 'atlas-phase4': JSON.stringify({ page }) })
      const html = renderToString(React.createElement(AppPhase4))
      assert.match(html, /ASKR|p4-shell/)
      assert.doesNotMatch(html, /undefined|null|NaN/)
    }
  } finally {
    delete globalThis.localStorage
    await cleanup()
  }
})


test('phase 4 Recovery route renders with primary app navigation intact', async () => {
  const { modulePath, cleanup } = await bundle('src/AppPhase4.jsx')
  try {
    const { default: AppPhase4 } = await import(modulePath)
    globalThis.localStorage = storageWith({ 'atlas-phase4': JSON.stringify({ page: 'recovery' }) })
    const html = renderToString(React.createElement(AppPhase4))
    for (const label of ['Home', 'Workout', 'Recovery', 'AI Coach', 'Food', 'Progress']) {
      assert.match(html, new RegExp(`>${label}<`))
    }
    assert.match(html, /Recovery command center/)
    assert.match(html, /Recovery forecast/)
    assert.match(html, /Muscle readiness/)
    assert.doesNotMatch(html, /undefined|null|NaN/)
  } finally {
    delete globalThis.localStorage
    await cleanup()
  }
})


test('nutrition platform renders dashboard logging recipes and integrations', async () => {
  const { modulePath, cleanup } = await bundle('src/NutritionPlatform.jsx')
  try {
    const { default: NutritionPlatform } = await import(modulePath)
    const html = renderToString(React.createElement(NutritionPlatform))
    for (const label of ['Nutrition Platform 1.0', 'Snabb loggning', 'Måltider idag', 'Recept och ingredienser', 'Nutrition trends', 'Träningsdagens kost']) {
      assert.match(html, new RegExp(label))
    }
    assert.doesNotMatch(html, /undefined|null|NaN/)
  } finally {
    await cleanup()
  }
})

test('recovery platform renders premium recovery architecture', async () => {
  const { modulePath, cleanup } = await bundle('src/RecoveryPlatform.jsx')
  try {
    const { default: RecoveryPlatform } = await import(modulePath)
    const html = renderToString(React.createElement(RecoveryPlatform, { core: { recovery: { score: 67, muscles: {} }, workouts: [] } }))
    for (const label of ['Recovery Platform 1.0', 'Recovery command center', 'Interactive Muscle Recovery Map', 'Muscle detail', 'Recovery Timeline', 'Future-ready architecture']) {
      assert.match(html, new RegExp(label))
    }
    assert.doesNotMatch(html, /undefined|null|NaN/)
  } finally {
    await cleanup()
  }
})
