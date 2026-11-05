export function restorePagesRoute(browserWindow, base) {
  const current = new URL(browserWindow.location.href)
  const root = new URL(base, current.origin)
  const route = current.searchParams.get('__spendly_route')
  if (current.pathname !== root.pathname || !route) return false

  try {
    const target = new URL(route, root)
    // Only restore paths within this app, even if a redirect query is edited.
    if (target.origin !== root.origin || !target.pathname.startsWith(root.pathname)) return false
    browserWindow.history.replaceState(
      browserWindow.history.state,
      '',
      target.pathname + target.search + target.hash,
    )
    return true
  } catch {
    return false
  }
}
