export const VALID_HOME_PAGES = new Set(['today', 'coach', 'goal', 'recovery', 'decisions', 'settings'])
export const atlasHomeTokens = { background: '#0A0A0A', surface: '#141414', surfaceRaised: '#1B1B1B', text: '#F5F5F5', muted: '#9A9A9A', lime: '#D4FF00', warning: '#9BBF00', danger: '#5C5C5C', radius: '20px', shadow: 'none', duration: '150ms' }
function isReal(value) { return value !== undefined && value !== null && !(typeof value === 'number' && Number.isNaN(value)) && value !== '' }
function number(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null }
function safeText(value, fallback = '') { const text = value === undefined || value === null ? '' : String(value).trim(); return text && text !== 'NaN' ? text : fallback }
function safeCount(value, fallback = 0) { const parsed = number(value); return parsed === null ? fallback : Math.max(0, Math.round(parsed)) }
function pct(value) { const parsed = number(value); return parsed === null ? null : `${Math.round(parsed)}%` }
function firstName(profile = {}, recommendation = {}) { return String(recommendation.context?.firstName || profile.firstName || profile.name || '').trim().split(/\s+/)[0] || 'du' }
function greeting(date = new Date()) { const hour = date.getHours(); if (hour < 10) return 'God morgon'; if (hour < 17) return 'Hej'; return 'God kväll' }
export function safeHomeTarget(target, fallback = 'today') { return VALID_HOME_PAGES.has(target) ? target : fallback }
function newest(workouts = []) { return [...workouts].sort((a,b) => new Date(b.completedAt || b.date || 0) - new Date(a.completedAt || a.date || 0))[0] || null }
function hasRecoveryEntries(core = {}) { return Object.keys(core.recovery?.muscles || {}).length > 0 || Boolean(core.recovery?.updatedAt) }
export function buildHomeViewModel({ profile = {}, core = {}, recommendation = {}, readiness, now = new Date() }) {
  const checkIn = profile.checkIn || {}
  const latest = recommendation.context?.latestWorkout || profile.coreSummary?.latestWorkout || newest(core.workouts)
  const weeklyCompletion = number(recommendation.context?.weeklyCompletion ?? profile.coreSummary?.recentWorkoutCount)
  const weeklyTarget = safeCount(profile.goal?.weeklySessions || profile.goal?.sessionsPerWeek || core.goalPlans?.active?.weeklySessions, 4)
  const hasRecoveryData = hasRecoveryEntries(core) || isReal(recommendation.context?.recoveryScore)
  const recoveryScore = hasRecoveryData ? number(recommendation.context?.recoveryScore ?? profile.recovery?.total ?? readiness ?? core.recovery?.score) : null
  const status = recommendation.insufficientData ? 'Logga dagsform och pass för mer personlig precision.' : safeText(recommendation.summary, 'ASKR väger samman återhämtning, mål och träningshistorik inför dagens val.')
  const metrics = [recoveryScore !== null && { id: 'recovery', label: 'Återhämtning', value: pct(recoveryScore), note: recoveryScore >= 70 ? 'Redo för kvalitet' : 'Hantera belastning' }, isReal(checkIn.sleep) && { id: 'sleep', label: 'Sömn', value: `${safeCount(checkIn.sleep)} h`, note: 'Senaste check-in' }, isReal(checkIn.energy) && { id: 'energy', label: 'Energi', value: `${safeCount(checkIn.energy)}/10`, note: 'Egen skattning' }, isReal(checkIn.motivation) && { id: 'motivation', label: 'Motivation', value: `${safeCount(checkIn.motivation)}/10`, note: 'Egen skattning' }, weeklyCompletion !== null && { id: 'week', label: 'Veckan', value: `${safeCount(weeklyCompletion)}/${weeklyTarget || '–'}`, note: 'Pass senaste 7 dagarna' }].filter(Boolean)
  const muscles = Object.entries(core.recovery?.muscles || {}).map(([name, value]) => ({ name: safeText(name, 'Muskel'), readiness: Math.max(0, Math.min(100, Math.round(100 - safeCount(value?.fatigue, 0)))) })).sort((a, b) => a.readiness - b.readiness).slice(0, 4)
  const confidence = recommendation.dataQuality ? `${safeText(recommendation.confidenceLabel, 'okänd')} säkerhet · ${safeText(recommendation.dataQuality.label, 'okänd')} datakvalitet (${safeCount(recommendation.dataQuality.signals)}/${safeCount(recommendation.dataQuality.possibleSignals)} signaler)` : `${safeCount(Number(recommendation.confidence || 0) * 100)}% säkerhet`
  const coachTitle = recommendation.insufficientData ? 'Coach väntar på data' : safeText(recommendation.decision?.title || recommendation.headline, 'Dagens coachråd')
  const coachSummary = safeText(recommendation.summary, 'Logga dagsform och pass så kan coachen prioritera nästa steg.')
  return { greeting: `${greeting(now)}, ${firstName(profile, recommendation)}`, status, headline: safeText(recommendation.headline, 'ASKR behöver mer underlag.'), explanation: safeText(recommendation.summary, status), confidence, primaryLabel: safeText(recommendation.primaryActionLabel, 'ÖPPNA COACH'), primaryTarget: safeHomeTarget(recommendation.primaryActionTarget, 'coach'), secondary: recommendation.alternatives?.[0] ? { label: safeText(recommendation.alternatives[0].label, 'Visa alternativ'), target: safeHomeTarget(recommendation.alternatives[0].target, 'coach') } : null, metrics, muscles, latest, weeklyCompletion, weeklyTarget, recoveryScore, hasRecoveryData, coachTitle, coachSummary, workoutTarget: safeHomeTarget(recommendation?.primaryActionTarget, 'goal'), insufficient: Boolean(recommendation.insufficientData) }
}
