import { useEffect, useState } from 'react'
import { Zap } from 'lucide-react'
import { BottomNavigation, Button, Card } from '../components'
import { localStorageRepository } from '../data/storage'
import { matchRoute } from './routes'

function useRoute() {
  const [path, setPath] = useState(window.location.pathname)

  useEffect(() => {
    const syncPath = () => setPath(window.location.pathname)
    window.addEventListener('popstate', syncPath)
    return () => window.removeEventListener('popstate', syncPath)
  }, [])

  const navigate = (nextPath: string) => {
    window.history.pushState({}, '', nextPath)
    setPath(nextPath)
  }

  return { path, navigate }
}

export function RideApp() {
  const { path, navigate } = useRoute()
  const route = matchRoute(path)
  const showNavigation = !['/', '/onboarding'].includes(path)
  useEffect(() => localStorageRepository.write('last-route', path), [path])

  if (path === '/') {
    return <main className="splash">
      <div className="ride-mark"><Zap /></div>
      <p>ASKR</p>
      <h1>RIDE</h1>
      <Button onClick={() => navigate('/onboarding')}>Kom igång</Button>
    </main>
  }

  if (path === '/onboarding') {
    return <main className="onboarding">
      <span className="eyebrow">ASKR RIDE</span>
      <h1>Din resa.<br />Ditt tempo.</h1>
      <p>En lugnare och smartare grund för varje tur — byggd för att växa med dig.</p>
      <Button onClick={() => navigate('/home')}>Fortsätt</Button>
    </main>
  }

  if (!route) {
    return <main className="not-found">
      <span className="eyebrow">404</span>
      <h1>Sidan finns inte</h1>
      <Button onClick={() => navigate('/home')}>Till startsidan</Button>
    </main>
  }

  const activePath = `/${route.section}`
  return <div className="ride-shell">
    <header>
      <button className="wordmark" onClick={() => navigate('/home')}>ASKR <span>RIDE</span></button>
      <span className="phase-label">FOUNDATION / 01</span>
    </header>
    <main className="screen">
      <span className="eyebrow">ASKR RIDE</span>
      <h1>{route.title}</h1>
      <Card>
        <span className="card-label">GRUND KLAR</span>
        <p>Den här vyn är redo att byggas i nästa fas.</p>
      </Card>
    </main>
    {showNavigation && <BottomNavigation activePath={activePath} navigate={navigate} />}
  </div>
}
