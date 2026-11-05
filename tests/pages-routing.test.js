import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { restorePagesRoute } from '../src/lib/pages-routing.js'

const origin = 'https://amnihudzori.github.io'
const base = '/Spendly/'
const fallback = readFileSync(new URL('../public/404.html', import.meta.url), 'utf8')
const fallbackScript = fallback.match(/<script>([\s\S]*?)<\/script>/)[1]

function mockBrowser(href) {
  const browser = {
    location: { href },
    history: {
      state: { retained: true },
      replaceState(state, _title, target) {
        browser.history.state = state
        browser.location.href = new URL(target, browser.location.href).href
      },
    },
  }
  return browser
}

for (const route of [
  'home', 'history', 'analytics', 'profile', 'welcome',
  'add?type=income',
  'edit/abc-123?return=%2Fhistory&note=A%26B#details',
  'history?search=Coffee%20%26%20Breakfast&category=food#transactions',
]) {
  test(`Pages refresh restores ${route} without losing its query or hash`, () => {
    const expected = origin + base + route
    let redirected
    const location = { href: expected, replace: (value) => { redirected = new URL(value, expected).href } }
    vm.runInNewContext(fallbackScript, { window: { location }, URL, encodeURIComponent })
    const redirect = new URL(redirected)
    assert.equal(redirect.pathname, base)
    assert.equal(redirect.searchParams.get('__spendly_route'), route)
    const browser = mockBrowser(redirected)
    assert.equal(restorePagesRoute(browser, base), true)
    assert.equal(browser.location.href, expected)
    assert.deepEqual(browser.history.state, { retained: true })
    assert.equal(restorePagesRoute(browser, base), false)
  })
}
test('ordinary root URLs and app queries are left alone', () => {
  for (const suffix of ['', '?type=income#details', '?__spendly_route=']) {
    const browser = mockBrowser(origin + base + suffix)
    const before = browser.location.href
    assert.equal(restorePagesRoute(browser, base), false)
    assert.equal(browser.location.href, before)
  }
})
test('edited redirect queries cannot leave Spendly or change origins', () => {
  for (const route of ['https://example.test/phishing', '//example.test/phishing', '../Recyclo/', '/Recyclo/', '/Spendly/../Recyclo/', 'javascript:alert(1)']) {
    const browser = mockBrowser(origin + base + '?__spendly_route=' + encodeURIComponent(route))
    const before = browser.location.href
    assert.equal(restorePagesRoute(browser, base), false)
    assert.equal(browser.location.href, before)
  }
})
test('the fallback never redirects another project path', () => {
  let redirected = false
  vm.runInNewContext(fallbackScript, {
    window: { location: { href: origin + '/Recyclo/home', replace: () => { redirected = true } } },
    URL, encodeURIComponent,
  })
  assert.equal(redirected, false)
})
