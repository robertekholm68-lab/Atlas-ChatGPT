import { useEffect, useState } from 'react'
import { Apple, Bot, Bug, Cloud, Dumbbell, HeartPulse, BatteryCharging, Info } from 'lucide-react'
import AppPhase4 from './AppPhase4'
import AppAICoach from './AppAICoach'
import AtlasDevPanel from './AtlasDevPanel'
import NutritionPlatform from './NutritionPlatform'
import RecoveryPlatform from './RecoveryPlatform'
import ProductionPlatform from './platform/ProductionPlatform'
import { getAtlasState, subscribeAtlas } from './core/atlasStore'
import { recordCompletedWorkout } from './core/eventEngine'
import { installPhase4Bridge } from './core/phase4Bridge'
import { ASKR_BUILD, ASKR_TAGLINE, ASKR_VERSION, AskrLogo, SplashScreen } from './brand.jsx'
import './appAtlas.css'

const STORAGE_KEY = 'askr-active-module-v1'

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
  const [showDevPanel, setShowDevPanel] = useState(false)

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
  const currentDecision = core.decisions?.current

  return (
    <div className="atlas-product-shell">
      <SplashScreen />
      <div className="atlas-module-switch" aria-label="Välj ASKR-modul">
        <div className="askr-switch-brand"><AskrLogo size="sm"/><small>Performance OS</small></div>
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
          className={module === 'nutrition' ? 'active' : ''}
          onClick={() => changeModule('nutrition')}
        >
          <Apple size={18} />
          <span>Kost</span>
        </button>
        <button
          type="button"
          className={module === 'recovery' ? 'active' : ''}
          onClick={() => changeModule('recovery')}
        >
          <BatteryCharging size={18} />
          <span>Recovery</span>
        </button>
        <button
          type="button"
          className={module === 'intelligence' ? 'active' : ''}
          onClick={() => changeModule('intelligence')}
        >
          <Bot size={18} />
          <span>Coach</span>
        </button>
        <button
          type="button"
          className={module === 'production' ? 'active' : ''}
          onClick={() => changeModule('production')}
        >
          <Cloud size={18} />
          <span>Cloud</span>
        </button>
        <span className="atlas-core-status" title={currentDecision?.title || 'Beräknas lokalt från genomförda set och RPE'}>
          <HeartPulse size={16} />
          Återhämtning {recovery}%
        </span>
        <button
          type="button"
          className={`atlas-dev-toggle ${showDevPanel ? 'active' : ''}`}
          onClick={() => setShowDevPanel(value => !value)}
          title="Öppna intern ASKR-diagnostik"
          aria-pressed={showDevPanel}
        >
          <Bug size={17}/>
          <span>Core</span>
        </button>
      </div>

      {module === 'training' && <AppPhase4 />}
      {module === 'nutrition' && <NutritionPlatform />}
      {module === 'recovery' && <RecoveryPlatform core={core} />}
      {module === 'intelligence' && <AppAICoach />}
      {module === 'production' && <ProductionPlatform />}
      {module === 'production' && <BrandInformation />}
      {showDevPanel && <AtlasDevPanel core={core} onClose={() => setShowDevPanel(false)}/>} 
    </div>
  )
}


function BrandInformation() {
  return (
    <section className="askr-about-panel" aria-labelledby="askr-about-title">
      <div className="askr-about-hero">
        <AskrLogo size="hero" />
        <p>{ASKR_TAGLINE}</p>
      </div>
      <div className="askr-about-copy">
        <span className="production-pill"><Info size={16}/> About ASKR</span>
        <h2 id="askr-about-title">ASKR</h2>
        <p>ASKR is a restrained performance application for training, recovery, nutrition and coach intelligence.</p>
        <dl>
          <div><dt>Version</dt><dd>{ASKR_VERSION}</dd></div>
          <div><dt>Build</dt><dd>{ASKR_BUILD}</dd></div>
          <div><dt>Brand</dt><dd>Strength, precision, technology, performance, discipline, recovery and evolution.</dd></div>
          <div><dt>Privacy</dt><dd>Privacy policy placeholder.</dd></div>
          <div><dt>Terms</dt><dd>Terms placeholder.</dd></div>
          <div><dt>Credits</dt><dd>Open-source acknowledgements placeholder.</dd></div>
          <div><dt>Website</dt><dd>Website placeholder.</dd></div>
          <div><dt>Support</dt><dd>Support placeholder.</dd></div>
        </dl>
      </div>
    </section>
  )
}
