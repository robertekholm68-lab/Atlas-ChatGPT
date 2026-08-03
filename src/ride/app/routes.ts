export const routes = [
  ['/', 'Splash'], ['/onboarding', 'Onboarding'], ['/home', 'Hem'], ['/discover', 'Upptäck'],
  ['/trip/:id', 'Utflyktsdetalj'], ['/navigation', 'Navigation'], ['/sessions', 'Pass'],
  ['/session/active', 'Aktivt pass'], ['/session/summary', 'Sammanfattning'], ['/analysis', 'AI-analys'],
  ['/goals', 'Mål'], ['/progress', 'Historik'], ['/profile', 'Profil'], ['/coach', 'AI Coach'], ['/settings', 'Inställningar'],
] as const

export function matchRoute(path: string) {
  return routes.find(([pattern]) => pattern === path || (pattern.includes(':id') && path.startsWith('/trip/'))) ?? routes[2]
}
