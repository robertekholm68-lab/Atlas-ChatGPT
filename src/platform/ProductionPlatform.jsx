import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, CheckCircle2, Cloud, Database, Image, KeyRound, Lock, Shield, Smartphone, Upload, User, WifiOff } from 'lucide-react'
import { atlasServices, authService } from './services.js'
import { friendlyError } from './errors.js'
import { installBackgroundSync, loadQueue, loadSyncStatus } from './syncEngine.js'
import './productionPlatform.css'

const settingsSections = ['Account', 'Units', 'Language', 'Notifications', 'Privacy', 'Coach', 'Theme', 'Connected Devices', 'Connected Apps', 'Export Data', 'Delete Account']

export default function ProductionPlatform() {
  const [mode, setMode] = useState('signin')
  const [message, setMessage] = useState('Production services run in local-first mode until Supabase env vars are configured.')
  const [sync, setSync] = useState(() => ({ state: navigator.onLine ? 'idle' : 'offline', pending: loadQueue().length, ...loadSyncStatus() }))
  const [uploadProgress, setUploadProgress] = useState(0)
  const [authBusy, setAuthBusy] = useState(false)
  const uploadTimer = useRef(null)

  useEffect(() => {
    const onSync = event => setSync(event.detail)
    window.addEventListener('atlas:sync-status', onSync)
    const uninstall = installBackgroundSync(atlasServices)
    return () => { window.removeEventListener('atlas:sync-status', onSync); uninstall(); window.clearInterval(uploadTimer.current) }
  }, [])

  async function submitAuth(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setAuthBusy(true)
    try {
      if (mode === 'signin') await authService.signIn({ email: form.get('email'), password: form.get('password') })
      if (mode === 'signup') await authService.signUp({ email: form.get('email'), password: form.get('password'), profile: { name: form.get('name') } })
      if (mode === 'forgot') await authService.forgotPassword(form.get('email'))
      if (mode === 'reset') await authService.resetPassword(form.get('password'))
      setMessage('Authentication request accepted. Verify email when Supabase Auth is connected.')
    } catch (error) {
      setMessage(friendlyError(error))
    } finally {
      setAuthBusy(false)
    }
  }

  const statusLabel = useMemo(() => ({ idle: 'Ready', syncing: 'Syncing', synced: 'Synced', pending: 'Pending', offline: 'Offline' }[sync.state] || sync.state), [sync.state])

  return <main className="production-platform">
    <section className="production-hero">
      <div><span className="production-pill"><Cloud size={16}/> Cloud 1.0</span><h1>ASKR Production Platform</h1><p>Authentication, profiles, sync, offline queue, storage, protected access, settings, notifications and export architecture for beta users.</p></div>
      <div className={`sync-card ${sync.state}`} aria-live="polite"><Cloud size={28}/><strong>{statusLabel}</strong><span>{sync.pending || 0} queued changes</span><small>Last sync: {sync.lastSyncAt ? new Date(sync.lastSyncAt).toLocaleString() : 'Not synced yet'}</small></div>
    </section>

    <section className="production-grid">
      <AuthCard mode={mode} setMode={setMode} submitAuth={submitAuth} message={message} busy={authBusy}/>
      <ProfileCard />
      <ArchitectureCard />
      <StorageCard uploadProgress={uploadProgress} setUploadProgress={setUploadProgress} uploadTimer={uploadTimer}/>
      <SettingsCard />
      <StatesCard />
    </section>
  </main>
}

function AuthCard({ mode, setMode, submitAuth, message, busy }) { return <section className="prod-panel auth-panel"><h2><Lock size={20}/> Authentication</h2><div className="mode-tabs">{['signin','signup','forgot','reset'].map(item => <button key={item} className={mode === item ? 'active' : ''} onClick={() => setMode(item)}>{item}</button>)}</div><form onSubmit={submitAuth}>{mode === 'signup' && <label>Name<input name="name" autoComplete="name" placeholder="Alex Atlas" /></label>}{mode !== 'reset' && <label>Email<input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label>}{mode !== 'forgot' && <label>Password<input name="password" type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} required minLength={8}/></label>}{mode === 'signin' && <label className="remember"><input type="checkbox" name="remember" defaultChecked/> Remember me</label>}<button className="primary-prod" type="submit" disabled={busy} aria-busy={busy}><KeyRound size={17}/> {busy ? 'Working…' : 'Continue'}</button></form><div className="oauth-row" aria-label="Future OAuth placeholders"><button disabled>Google</button><button disabled>Apple</button><button disabled>GitHub</button></div><p className="prod-note">{message}</p></section> }
function ProfileCard(){ const fields = ['Name','Username','Email','Profile image','Birth year','Height','Weight','Goals','Units','Language','Time zone','Preferences','Coach personality','Privacy settings']; return <section className="prod-panel"><h2><User size={20}/> Profile model</h2><div className="chip-grid">{fields.map(field => <span key={field}>{field}</span>)}</div></section> }
function ArchitectureCard(){ return <section className="prod-panel"><h2><Database size={20}/> Service architecture</h2><ul className="check-list"><li><CheckCircle2/> Auth, Profile, Workout, Nutrition, Recovery, Coach, Goals, Storage and Notifications services.</li><li><Shield/> Protected route and role model prepared for User, Coach, Admin and Team Owner.</li><li><WifiOff/> Local-first writes queue offline changes with retry and conflict detection hooks.</li><li><Bell/> Reminder and analytics consent architecture prepared without vendor lock-in.</li></ul></section> }
function StorageCard({ uploadProgress, setUploadProgress, uploadTimer }){ return <section className="prod-panel"><h2><Image size={20}/> Supabase Storage</h2><p>Buckets prepared for profile images, progress photos, exercise assets, future videos, coach attachments and avatars.</p><button className="secondary-prod" onClick={() => { window.clearInterval(uploadTimer.current); setUploadProgress(0); uploadTimer.current = window.setInterval(() => setUploadProgress(v => v >= 100 ? (window.clearInterval(uploadTimer.current), 100) : v + 20), 120) }}><Upload size={16}/> Simulate upload</button><div className="upload-track"><span style={{ width: `${uploadProgress}%` }}/></div></section> }
function SettingsCard(){ return <section className="prod-panel settings-panel"><h2><Smartphone size={20}/> Settings</h2>{settingsSections.map(section => <button key={section}>{section}<span>Configure</span></button>)}</section> }
function StatesCard(){ return <section className="prod-panel"><h2><CheckCircle2 size={20}/> UX states</h2><div className="skeleton"/><div className="empty-state">No notifications yet</div><div className="success-state">Profile saved</div><div className="error-state">Retry available when network returns</div></section> }
