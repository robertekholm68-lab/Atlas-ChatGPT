export type RideRoute = {
  path: string
  title: string
  section: 'launch' | 'home' | 'discover' | 'sessions' | 'progress' | 'profile'
}

export const routes: RideRoute[] = [
  { path: '/', title: 'Splash', section: 'launch' },
  { path: '/onboarding', title: 'Onboarding', section: 'launch' },
  { path: '/home', title: 'Hem', section: 'home' },
  { path: '/discover', title: 'Upptäck', section: 'discover' },
  { path: '/trip/:id', title: 'Utflyktsdetalj', section: 'discover' },
  { path: '/navigation', title: 'Navigation', section: 'discover' },
  { path: '/sessions', title: 'Pass', section: 'sessions' },
  { path: '/session/active', title: 'Aktivt pass', section: 'sessions' },
  { path: '/session/summary', title: 'Sammanfattning', section: 'sessions' },
  { path: '/analysis', title: 'AI-analys', section: 'progress' },
  { path: '/goals', title: 'Mål', section: 'progress' },
  { path: '/progress', title: 'Historik', section: 'progress' },
  { path: '/profile', title: 'Profil', section: 'profile' },
  { path: '/coach', title: 'AI Coach', section: 'profile' },
  { path: '/settings', title: 'Inställningar', section: 'profile' },
]

export function matchRoute(path: string) {
  return routes.find(route => route.path === path || (route.path === '/trip/:id' && /^\/trip\/[^/]+$/.test(path)))
}
