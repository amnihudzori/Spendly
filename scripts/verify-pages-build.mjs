import assert from 'node:assert/strict'
import { readFile, readdir, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const base = '/Spendly/'
const dist = fileURLToPath(new URL('../dist/', import.meta.url))
const html = await readFile(path.join(dist, 'index.html'), 'utf8')
assert.ok(!html.includes('/src/main.jsx'), 'Pages must publish compiled output, not the source entry')
assert.ok(!html.includes('%BASE_URL%'), 'Vite must resolve the HTML base placeholder')

async function verifyAsset(url, relativeTo = 'index.html') {
  const resolved = new URL(url, `https://example.test${base}${relativeTo}`)
  assert.equal(resolved.origin, 'https://example.test', `Unexpected external asset: ${url}`)
  assert.ok(resolved.pathname.startsWith(base), `Asset is outside ${base}: ${url}`)
  const localPath = path.join(dist, decodeURIComponent(resolved.pathname.slice(base.length)))
  assert.ok((await stat(localPath)).isFile(), `Missing build asset: ${url}`)
}

const assets = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => match[1])
assert.ok(assets.some((url) => url.endsWith('.js')), 'Missing compiled JavaScript entry')
assert.ok(assets.some((url) => url.endsWith('.css')), 'Missing compiled stylesheet')
for (const url of assets) {
  assert.ok(url.startsWith(base), `Entry asset must use ${base}: ${url}`)
  await verifyAsset(url)
}

let fonts = 0
for (const filename of await readdir(path.join(dist, 'assets'))) {
  if (!filename.endsWith('.css')) continue
  const css = await readFile(path.join(dist, 'assets', filename), 'utf8')
  for (const match of css.matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/g)) {
    if (match[1].startsWith('data:')) continue
    await verifyAsset(match[1], `assets/${filename}`)
    fonts++
  }
}
assert.ok(fonts > 0, 'Expected bundled Poppins font assets')
const fallback = await readFile(path.join(dist, '404.html'), 'utf8')
assert.ok(fallback.includes("var base = '/Spendly/';"), 'Missing project-scoped Pages fallback')
assert.ok(fallback.includes('__spendly_route='), 'Missing deep-link redirect')
console.log(`Verified ${assets.length} entry assets and ${fonts} font URLs under ${base}, plus dist/404.html.`)
for (const url of assets) console.log(`  ${url}`)
