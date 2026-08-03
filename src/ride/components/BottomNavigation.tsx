import { ChartNoAxesColumn, Compass, Home, PlayCircle, UserCircle } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

export type NavigationItem = { label: string; path: string; icon: ComponentType<SVGProps<SVGSVGElement>> }
export const navigationItems: NavigationItem[] = [
  { label: 'Hem', path: '/home', icon: Home }, { label: 'Upptäck', path: '/discover', icon: Compass },
  { label: 'Pass', path: '/sessions', icon: PlayCircle }, { label: 'Utveckling', path: '/progress', icon: ChartNoAxesColumn },
  { label: 'Profil', path: '/profile', icon: UserCircle },
]

export function BottomNavigation({ activePath, navigate }: { activePath: string; navigate: (path: string) => void }) {
  return <nav className="bottom-nav" aria-label="Huvudnavigation">
    {navigationItems.map(({ label, path: itemPath, icon: Icon }) => {
      const active = activePath === itemPath
      return <button
        key={itemPath}
        aria-current={active ? 'page' : undefined}
        onClick={() => navigate(itemPath)}
      >
        <Icon aria-hidden="true" />
        <span>{label}</span>
      </button>
    })}
  </nav>
}
