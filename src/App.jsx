import { useMemo, useState } from 'react'
import {
  Activity,
  Apple,
  ArrowRight,
  BarChart3,
  BatteryCharging,
  Bell,
  Bot,
  ChevronRight,
  Dumbbell,
  Flame,
  HeartPulse,
  Home,
  Moon,
  Plus,
  Search,
  Settings,
  Sparkles,
  Target,
  TimerReset,
  TrendingUp,
  UserRound,
  Utensils,
  Zap
} from 'lucide-react'

const navItems = [
  { id: 'today', label: 'Idag', icon: Home },
  { id: 'train', label: 'Träning', icon: Dumbbell },
  { id: 'body', label: 'Kropp', icon: Activity },
  { id: 'nutrition', label: 'Kost', icon: Utensils },
  { id: 'coach', label: 'Coach', icon: Bot }
]

const pageMeta = {
  today: ['God morgon, Robert', 'Din kropp är redo för ett kvalitativt pass.'],
  train: ['Träning', 'Planera, starta och följ dagens pass.'],
  body: ['Kroppsstatus', 'Belastning och återhämtning i ett sammanhang.'],
  nutrition: ['Kost', 'En tydlig bild av energi, protein och vanor.'],
  coach: ['ATLAS Coach', 'Personliga råd grundade i din träningsdata.']
}

function App() {
  const [activePage, setActivePage] = useState('today')
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedMuscle, setSelectedMuscle] = useState('Rygg')
  const [toast, setToast] = useState('')

  const [title, subtitle] = pageMeta[activePage]

  function notify(message) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2200)
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Huvudnavigation">
        <Brand />
        <nav className="desktop-nav">
          {navItems.map((item) => (
            <NavButton key={item.id} item={item} active={activePage === item.id} onClick={() => setActivePage(item.id)} />
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="profile-card" onClick={() => setMenuOpen(!menuOpen)}>
            <span className="avatar">RE</span>
            <span><strong>Robert</strong><small>ATLAS Member</small></span>
            <Settings size={17} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Tisdag · 21 juli</p>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="topbar-actions">
            <button className="icon-button" aria-label="Sök"><Search size={19} /></button>
            <button className="icon-button notification" aria-label="Notiser"><Bell size={19} /><span /></button>
          </div>
        </header>

        <section className="page-stage">
          {activePage === 'today' && <TodayPage navigate={setActivePage} notify={notify} />}
          {activePage === 'train' && <TrainingPage notify={notify} />}
          {activePage === 'body' && <BodyPage selected={selectedMuscle} setSelected={setSelectedMuscle} />}
          {activePage === 'nutrition' && <NutritionPage notify={notify} />}
          {activePage === 'coach' && <CoachPage notify={notify} />}
        </section>
      </main>

      <nav className="mobile-nav" aria-label="Mobilnavigation">
        {navItems.map((item) => <NavButton key={item.id} item={item} active={activePage === item.id} onClick={() => setActivePage(item.id)} compact />)}
      </nav>

      {menuOpen && <div className="profile-popover"><strong>Robert Ekholm</strong><span>Inställningar och profil kommer i nästa fas.</span></div>}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

function Brand() {
  return <div className="brand"><div className="brand-mark">A</div><div><strong>ATLAS</strong><small>TRAIN SMARTER</small></div></div>
}

function NavButton({ item, active, onClick, compact = false }) {
  const Icon = item.icon
  return <button className={`nav-button ${active ? 'active' : ''} ${compact ? 'compact' : ''}`} onClick={onClick}><Icon size={20} /><span>{item.label}</span></button>
}

function TodayPage({ navigate, notify }) {
  return <div className="dashboard-grid">
    <section className="hero-card span-8">
      <div className="hero-copy">
        <span className="status-pill"><Sparkles size={15} /> Dagens rekommendation</span>
        <h2>Överkropp · styrka</h2>
        <p>Din återhämtning är stabil. Kör planerat pass, men håll två repetitioner i reserv på de tyngsta seten.</p>
        <div className="hero-actions">
          <button className="primary-button" onClick={() => navigate('train')}><Dumbbell size={18} /> Starta pass</button>
          <button className="text-button" onClick={() => notify('Dagens plan är sparad')}>Visa upplägg <ArrowRight size={17} /></button>
        </div>
      </div>
      <div className="readiness-ring"><span>82</span><small>Redo</small></div>
    </section>

    <MetricCard className="span-4" icon={BatteryCharging} label="Återhämtning" value="82%" note="+6 mot i går" tone="positive" />
    <MetricCard className="span-4" icon={Moon} label="Sömn" value="7 h 24 m" note="Bra kontinuitet" />
    <MetricCard className="span-4" icon={HeartPulse} label="Vilopuls" value="52 bpm" note="Under din baslinje" tone="positive" />
    <MetricCard className="span-4" icon={Flame} label="Veckobelastning" value="68%" note="Inom optimal zon" />

    <section className="panel span-7">
      <SectionHeading eyebrow="Senaste 7 dagarna" title="Träningsrytm" action="Visa historik" />
      <div className="activity-chart" aria-label="Träningsbelastning senaste veckan">
        {[42, 74, 28, 88, 54, 92, 64].map((height, index) => <div key={index} className="chart-day"><div style={{ height: `${height}%` }} /><span>{['M','T','O','T','F','L','S'][index]}</span></div>)}
      </div>
    </section>

    <section className="panel span-5">
      <SectionHeading eyebrow="Mål" title="Thailand-resan" action="Detaljer" />
      <div className="goal-progress"><div><strong>74%</strong><span>Mot delmålet</span></div><div className="progress-track"><span style={{ width: '74%' }} /></div></div>
      <ul className="clean-list"><li><Target size={17} /> 2 styrkepass kvar denna vecka</li><li><TrendingUp size={17} /> VO₂ max utvecklas positivt</li></ul>
    </section>
  </div>
}

function TrainingPage({ notify }) {
  const exercises = [
    ['Bänkpress', '4 × 6', 'Bröst · Triceps'],
    ['Sittande rodd', '4 × 8', 'Rygg · Biceps'],
    ['Axelpress', '3 × 8', 'Axlar · Triceps'],
    ['Latsdrag', '3 × 10', 'Rygg · Biceps']
  ]
  return <div className="dashboard-grid">
    <section className="hero-card training-hero span-8"><div><span className="status-pill"><Zap size={15} /> Redo att träna</span><h2>Överkropp A</h2><p>50–60 minuter · 16 arbetsset · Medelhög belastning</p><button className="primary-button" onClick={() => notify('Passet är startat')}><Dumbbell size={18} /> Starta träningspass</button></div><TimerReset size={88} strokeWidth={1.2} /></section>
    <MetricCard className="span-4" icon={BarChart3} label="Planerad volym" value="7 840 kg" note="Normal belastning" />
    <section className="panel span-8"><SectionHeading eyebrow="Dagens pass" title="Övningar" action="Redigera" /><div className="exercise-list">{exercises.map(([name, sets, muscles], i) => <button key={name} className="exercise-row" onClick={() => notify(`${name} vald`)}><span className="exercise-index">{i + 1}</span><span><strong>{name}</strong><small>{muscles}</small></span><b>{sets}</b><ChevronRight size={18} /></button>)}</div></section>
    <section className="panel span-4"><SectionHeading eyebrow="Veckan" title="Plan" /><div className="week-plan"><div className="done">Mån<small>Överkropp</small></div><div className="active">Tis<small>Vila</small></div><div>Ons<small>Underkropp</small></div><div>Fre<small>Överkropp</small></div></div></section>
  </div>
}

function BodyPage({ selected, setSelected }) {
  const muscles = [
    ['Bröst', 72, 'Återhämtad'], ['Rygg', 58, 'Lätt belastad'], ['Axlar', 84, 'Redo'],
    ['Armar', 76, 'Redo'], ['Ben', 91, 'Fullt återhämtade'], ['Bål', 67, 'Normal']
  ]
  const current = muscles.find(([name]) => name === selected) || muscles[0]
  return <div className="dashboard-grid">
    <section className="panel body-map-panel span-7"><SectionHeading eyebrow="Interaktiv översikt" title="Muskelstatus" action="Framsida" /><div className="body-map"><div className="body-silhouette"><span className="head" /><span className="torso" /><span className="arm left" /><span className="arm right" /><span className="leg left" /><span className="leg right" /><i className="muscle-glow back" /></div></div><div className="legend"><span><i className="ready" /> Redo</span><span><i className="loaded" /> Belastad</span><span><i className="attention" /> Uppmärksamhet</span></div></section>
    <section className="panel span-5"><SectionHeading eyebrow="Vald muskelgrupp" title={current[0]} /><div className="large-score"><strong>{current[1]}%</strong><span>{current[2]}</span></div><div className="progress-track"><span style={{ width: `${current[1]}%` }} /></div><p className="muted-copy">Baserat på träningsvolym, tid sedan senaste pass och din rapporterade återhämtning.</p></section>
    <section className="panel span-12"><SectionHeading eyebrow="Alla områden" title="Återhämtningsstatus" /><div className="muscle-grid">{muscles.map(([name, score, status]) => <button className={selected === name ? 'selected' : ''} key={name} onClick={() => setSelected(name)}><span><strong>{name}</strong><small>{status}</small></span><b>{score}%</b></button>)}</div></section>
  </div>
}

function NutritionPage({ notify }) {
  return <div className="dashboard-grid">
    <section className="hero-card nutrition-hero span-8"><div><span className="status-pill"><Apple size={15} /> Dagens energi</span><h2>1 420 av 2 050 kcal</h2><p>Du ligger bra till. Prioritera protein och grönsaker i nästa måltid.</p><button className="primary-button" onClick={() => notify('Måltidslogg öppnad')}><Plus size={18} /> Logga måltid</button></div><div className="macro-donut"><span>69%</span></div></section>
    <MetricCard className="span-4" icon={Flame} label="Kvar idag" value="630 kcal" note="Flexibelt utrymme" />
    <MacroCard label="Protein" value="132 / 170 g" progress={78} />
    <MacroCard label="Kolhydrater" value="146 / 210 g" progress={70} />
    <MacroCard label="Fett" value="48 / 68 g" progress={71} />
    <section className="panel span-12"><SectionHeading eyebrow="Dagens logg" title="Måltider" action="Visa allt" /><div className="meal-list">{[['Frukost','Yoghurt, granola och bär','410 kcal'],['Lunch','Kyckling, ris och grönsaker','620 kcal'],['Mellanmål','Clear whey och banan','390 kcal']].map((meal) => <div key={meal[0]}><span><strong>{meal[0]}</strong><small>{meal[1]}</small></span><b>{meal[2]}</b></div>)}</div></section>
  </div>
}

function CoachPage({ notify }) {
  const prompts = ['Hur bör jag träna idag?', 'Varför är min återhämtning lägre?', 'Justera veckans träningsplan']
  return <div className="coach-layout">
    <section className="coach-intro"><div className="coach-orb"><Bot size={42} /></div><span className="status-pill"><Sparkles size={15} /> Personlig analys</span><h2>Vad vill du ha hjälp med?</h2><p>ATLAS väger samman träning, återhämtning, mål och dina egna upplevelser.</p></section>
    <div className="prompt-grid">{prompts.map((prompt) => <button key={prompt} onClick={() => notify('Frågan skickades till coachen')}><Sparkles size={18} /><span>{prompt}</span><ArrowRight size={18} /></button>)}</div>
    <section className="coach-composer"><input aria-label="Skriv till ATLAS Coach" placeholder="Fråga ATLAS Coach…" /><button onClick={() => notify('Meddelandet skickades')}><ArrowRight size={20} /></button></section>
    <section className="panel coach-insight"><SectionHeading eyebrow="Dagens insikt" title="Du svarar bra på jämn träningsrytm" /><p>Under veckor med 3–4 jämnt fördelade pass har din vilopuls varit lägre och den upplevda energin högre. Undvik att samla all volym sent i veckan.</p></section>
  </div>
}

function MetricCard({ icon: Icon, label, value, note, tone = '', className = '' }) {
  return <article className={`metric-card ${className}`}><div className="metric-icon"><Icon size={20} /></div><span>{label}</span><strong>{value}</strong><small className={tone}>{note}</small></article>
}

function MacroCard({ label, value, progress }) {
  return <article className="panel macro-card span-4"><span>{label}</span><strong>{value}</strong><div className="progress-track"><span style={{ width: `${progress}%` }} /></div></article>
}

function SectionHeading({ eyebrow, title, action }) {
  return <div className="section-heading"><div><span>{eyebrow}</span><h3>{title}</h3></div>{action && <button>{action} <ChevronRight size={16} /></button>}</div>
}

export default App
