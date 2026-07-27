import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('PWA metadata uses the ASKR identity and approved Ink theme', async () => {
  const [manifestText, html] = await Promise.all([read('public/manifest.webmanifest'), read('index.html')])
  const manifest = JSON.parse(manifestText)

  assert.equal(manifest.name, 'ASKR')
  assert.equal(manifest.display, 'standalone')
  assert.equal(manifest.theme_color, '#0A0A0A')
  assert.ok(manifest.icons.some(icon => icon.purpose.includes('maskable')))
  assert.match(html, /rel="manifest"/)
  assert.match(html, /<title>ASKR<\/title>/)
})

test('offline shell supports navigation fallback and cache upgrades', async () => {
  const worker = await read('public/service-worker.js')

  assert.match(worker, /indexResponse\.clone\(\)\.text\(\)/)
  assert.match(worker, /html\.matchAll/)
  assert.match(worker, /cache\.addAll/)
  assert.match(worker, /request\.mode === 'navigate'/)
  assert.match(worker, /caches\.match\('\/index\.html'\)/)
  assert.match(worker, /key !== CACHE_NAME/)
})

test('production shell recovers from invalid persisted navigation and avoids fabricated recovery', async () => {
  const shell = await read('src/AppAtlas.jsx')

  assert.match(shell, /MODULES\.has\(value\) \? value : 'training'/)
  assert.match(shell, /Boolean\(core\.recovery\?\.updatedAt\)/)
  assert.match(shell, /hasRecoveryData \? `\$\{core\.recovery\.score\}%` : '–'/)
})
