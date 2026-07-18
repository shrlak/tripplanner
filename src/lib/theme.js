// Applies the light/dark/auto appearance preference to <html data-theme>.
// A matching inline script in index.html does this same read synchronously
// before React mounts, so there's no flash of the wrong theme on load —
// this keeps it in sync afterward as the preference or OS setting changes.
export const THEMES = ['light', 'dark', 'auto']

export function applyTheme(theme) {
  document.documentElement.dataset.theme = THEMES.includes(theme) ? theme : 'light'
  const meta = document.querySelector('meta[name="theme-color"]')
  if (!meta) return
  const isDark =
    theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  meta.setAttribute('content', isDark ? '#000000' : '#f5f5f7')
}
