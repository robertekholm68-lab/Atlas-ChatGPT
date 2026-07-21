import { evaluateAtlasDecisions } from './decisionEngine.js'
import { evaluateGoalPlan } from './goalEngine.js'
import { selectAtlasInsights } from './insightEngine.js'

const DAY_MS = 86400000
const TRAIN_TARGET = 'training'
const RECOVERY_TARGET = 'recovery'
const GOAL_TARGET = 'goal'

function clone(value) { return JSON.parse(JSON.stringify(value ?? null)) }
function iso(now) { return new Date(now).toISOString() }
function pct(value) { return `${Math.round(value)} %` }
function firstName(profile = {}) { return String(profile.name || profile.firstName || 'Robert').trim().split(/\s+/)[0] || 'du' }
function confidenceLabel(confidence) { return confidence >= 0.8 ? 'hög' : confidence >= 0.55 ? 'måttlig' : confidence > 0 ? 'låg' : 'otillräcklig' }
function dataQualityLabel(score) { return score >= 0.75 ? 'stark' : score >= 0.45 ? 'begränsad' : 'otillräcklig' }
function timeOf(item) { const value = item?.completedAt || item?.createdAt || item?.updatedAt || item?.date; const t = value ? new Date(String(value).includes('T') ? value : `${value}T12:00:00`).getTime() : 0; return Number.isFinite(t) ? t : 0 }
function readinessEntries(recovery = {}) { return Object.entries(recovery.muscles || {}).map(([name, v]) => ({ name, fatigue: Number(v?.fatigue || 0), readiness: Math.max(0, Math.round(100 - Number(v?.fatigue || 0))) })).sort((a,b) => b.readiness - a.readiness) }
function latestWorkout(workouts = []) { return [...workouts].sort((a,b) => timeOf(b) - timeOf(a))[0] || null }
function recentWorkoutCount(workouts = [], now) { return workouts.filter(w => now - timeOf(w) <= 7 * DAY_MS).length }
function buildDataQuality(state) { const points = [state.workouts?.length >= 3, Object.keys(state.recovery?.muscles || {}).length >= 1, Boolean(state.decisions?.current), Boolean(state.goals?.length || state.goalPlans?.active), Boolean(state.memory?.generatedAt), Boolean((state.predictions?.items || []).some(p => p.status === 'active' && Number(p.confidence) >= 0.5))]; const score = points.filter(Boolean).length / points.length; return { score: Math.round(score * 100) / 100, label: dataQualityLabel(score), signals: points.filter(Boolean).length, possibleSignals: points.length } }
function reason(text, weight, source, value = null) { return { text, weight, source, value } }
function actionFor(decision, insufficient) { if (insufficient) return { primaryAction: 'check-in', primaryActionLabel: 'LOGGA DAGSFORM', primaryActionTarget: 'recovery', alternativeAction: { label: 'VISA PROGRAM', target: 'goal' } }; if (decision?.category === 'recovery' || decision?.action === 'reduce-load') return { primaryAction: 'recovery', primaryActionLabel: 'VÄLJ ÅTERHÄMTNING', primaryActionTarget: RECOVERY_TARGET, alternativeAction: { label: 'Visa programmet', target: GOAL_TARGET } }; if (decision?.action === 'modify-volume' || decision?.action === 'modify') return { primaryAction: 'adjust-workout', primaryActionLabel: 'JUSTERA DAGENS PASS', primaryActionTarget: TRAIN_TARGET, alternativeAction: { label: 'Ta en återhämtningsdag', target: RECOVERY_TARGET } }; return { primaryAction: 'start-workout', primaryActionLabel: `STARTA PASS${decision?.title?.includes('Rygg') ? ' – RYGG' : ''}`, primaryActionTarget: TRAIN_TARGET, alternativeAction: { label: 'Visa programmet', target: GOAL_TARGET } } }

export function buildCoachRecommendation(inputState = {}, now = Date.now()) {
  const state = clone(inputState) || {}
  const dataQuality = buildDataQuality(state)
  const muscles = readinessEntries(state.recovery)
  const best = muscles[0]
  const worst = [...muscles].sort((a,b) => a.readiness - b.readiness)[0]
  const decisionOutput = state.decisions?.current ? { current: state.decisions.current } : evaluateAtlasDecisions(state, { trigger: 'coach.recommendation' })
  const decision = decisionOutput.current
  const workouts = state.workouts || []
  const latest = latestWorkout(workouts)
  const predictions = (state.predictions?.items || []).filter(p => p.status === 'active')
  const visiblePrediction = predictions.find(p => Number(p.confidence) >= 0.5)
  const goalPlan = state.goalPlans?.active || (state.goals?.[0] ? evaluateGoalPlan(state.goals[0], state, now) : null)
  const insufficientData = dataQuality.score < 0.35 || (!workouts.length && !muscles.length)
  const reasons = []
  if (decision?.evidence) decision.evidence.forEach((e, i) => reasons.push(reason(e, 90 - i, 'decision-engine')))
  if (best) reasons.push(reason(`${best.name} är ${pct(best.readiness)} återhämtad.`, 84, 'recovery-engine', best.readiness))
  if (worst && worst.readiness < 60) reasons.push(reason(`${worst.name} behöver mer återhämtning (${pct(worst.readiness)}).`, 88, 'recovery-engine', worst.readiness))
  if (latest) reasons.push(reason(`Senaste passet var ${latest.name || 'träningspass'} för ${Math.max(0, Math.floor((now - timeOf(latest)) / DAY_MS))} dagar sedan.`, 72, 'memory-engine'))
  if (goalPlan) reasons.push(reason(goalPlan.alerts?.[0] || `Aktivt mål: ${goalPlan.title || goalPlan.target}.`, goalPlan.alerts?.length ? 76 : 55, 'goal-engine'))
  if (visiblePrediction) reasons.push(reason(visiblePrediction.recommendation || visiblePrediction.description, 50 + Number(visiblePrediction.confidence) * 20, 'prediction-engine'))
  const uniqueReasons = [...new Map(reasons.map(r => [r.text, r])).values()].sort((a,b) => b.weight - a.weight).slice(0, 5)
  const confidence = insufficientData ? 0.18 : Math.min(0.94, Math.max(0.42, dataQuality.score * 0.55 + (Number(visiblePrediction?.confidence || 0.4) * 0.2) + (decision ? 0.2 : 0)))
  const actions = actionFor(decision, insufficientData)
  const cautious = confidence < 0.55 ? 'Underlaget är fortfarande begränsat, men' : confidence < 0.8 ? 'Baserat på din senaste data rekommenderar ATLAS' : ''
  const headline = insufficientData ? 'ATLAS behöver mer underlag.' : (cautious ? `${cautious} ${String(decision?.title || 'fortsatt planerad träning').toLowerCase()}.` : decision?.title || 'Fortsätt enligt planen')
  const expectedImpact = visiblePrediction && Number(visiblePrediction.confidence) >= 0.5 ? (visiblePrediction.recommendation || visiblePrediction.description) : null
  return { id: `coach-rec-${now}`, generatedAt: iso(now), decision: decision || null, headline, summary: insufficientData ? 'Logga dagsform och några träningspass för att få en personlig rekommendation.' : decision?.message || 'ATLAS väger samman aktuell återhämtning, mål, minne, insikter och prognoser.', confidence, confidenceLabel: confidenceLabel(confidence), ...actions, reasons: uniqueReasons, expectedImpact, cautions: predictions.filter(p => p.category === 'recovery' && Number(p.confidence) >= 0.5).map(p => p.description).slice(0,2), supportingInsights: selectAtlasInsights(state).slice(0,3), alternatives: actions.alternativeAction ? [actions.alternativeAction] : [], dataQuality, insufficientData, context: { firstName: firstName(state.profile), recoveryScore: state.recovery?.score ?? null, weeklyCompletion: recentWorkoutCount(workouts, now), latestWorkout: latest, activeGoal: goalPlan?.title || goalPlan?.target || null } }
}
