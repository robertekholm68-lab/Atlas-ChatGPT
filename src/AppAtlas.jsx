import { useEffect, useState } from 'react'
import { Bot, Dumbbell, HeartPulse } from 'lucide-react'
import AppPhase4 from './AppPhase4'
import AppIntelligence from './AppIntelligence'
import { getAtlasState, subscribeAtlas } from './core/atlasStore'
import { recordCompletedWorkout } from './core/eventEngine'
import { installPhase4Bridge } from './core/phase4Bridge'
import './appAtlas.css'

const STORAGE_KEY = 'atlas-active-module-v1'

function loadModule() {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'training'
  } catch {
    return 'training'
  }
}

function importLegacyWorkouts() {
  try {
    const phase4 = JSON.parse(localStorage.getItem('atlas-phase4') || '{}')
    ;(phase4.history || []).slice().reverse().forEach(recordCompletedWorkout)
  } catch {
    // Äldre lokal data är valfri och får aldrig stoppa appen.
  }
}

export default function AppAtlas() {
  const [module, setModule] = useState(loadModule)
  const [core, setCore] = useState(getAtlasState)

  useEffect(() => {
    importLegacyWorkouts()
    const uninstallBridge = installPhase4Bridge()
    const unsubscribe = subscribeAtlas(setCore)

    return () => {
      uninstallBridge()
      unsubscribe()
    }
  }, [])

  function changeModule(nextModule) {
    setModule(nextModule)
    try {
      localStorage.setItem(STORAGE_KEY, nextModule)
    } catch {
      // Appen fungerar även när webbläsaren blockerar lokal lagring.
    }
  }

  const recovery = core.recovery?.score ?? 100

  return (
    <div className="atlas-product-shell">
      <div className="atlas-module-switch" aria-label="Välj ATLAS-modul">
        <button
          type="button"
          className={module === 'training' ? 'active' : ''}
          onClick={() => changeModule('training')}
        >
          <Dumbbell size={18} />
          <span>Träning</span>
        </button>
        <button
          type="button"
          className={module === 'intelligence' ? 'active' : ''}
          onClick={() => changeModule('intelligence')}
        >
          <Bot size={18} />
          <span>Coach</span>
        </button>
        <span className="atlas-core-status" title="Beräknas lokalt från genomförda set och RPE">
          <HeartPulse size={16} />
          Återhämtning {recovery}%
        </span>
      </div>

      {module === 'training' ? <AppPhase4 /> : <AppIntelligence />}
    </div>
  )
}
