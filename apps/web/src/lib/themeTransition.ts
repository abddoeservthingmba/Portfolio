/**
 * A short colour cross-fade for a theme change.
 *
 * Without this, switching light/dark or visual style snaps every surface at
 * once, which reads as a glitch rather than a choice. The `theme-transition`
 * class gives every element a colour transition for the length of the change,
 * then removes it, so ordinary hover and motion are not slowed down afterwards.
 *
 * Skipped under reduced motion: the change still happens, just instantly.
 */
const DURATION_MS = 700;

export function animateThemeChange(): void {
  if (typeof window === 'undefined') return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  const root = document.documentElement;
  root.classList.add('theme-transition');
  window.setTimeout(() => root.classList.remove('theme-transition'), DURATION_MS);
}
