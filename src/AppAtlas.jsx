import { useState } from 'react'
import { Bot, Dumbbell } from 'lucide-react'
import AppPhase4 from './AppPhase4'
import AppIntelligence from './AppIntelligence'
import './appAtlas.css'

const STORAGE_KEY = 'atlas-active-module-v1'

function loadModule() {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'training'
  } catch {
    return 'training'
  }
}

export default function AppAtlas() {
  const [module, setModule] = useState(loadModule)

  function changeModule(nextModule) {
    setModule(nextModule)
    try {
      localStorage.setItem(STORAGE_KEY, nextModule)
    } catch {
      // Appen fungerar även när webbläsaren blockerar lokal lagring.
    }
  }

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
      </div>

      {module === 'training' ? <AppPhase4 /> : <AppIntelligence />}
    </div>
  )
}
