const DAY_MS = 24 * 60 * 60 * 1000

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function resolvedWeeks(goal, now = Date.now()) {
  if (goal?.targetDate) {
    const target = new Date(goal.targetDate).getTime()
    if (Number.isFinite(target)) return Math.max(0, Math.ceil((target - now) / (7 * DAY_MS)))
  }
  return Math.max(0, Number(goal?.weeks || 0))
}

function splitWeeks(totalWeeks) {
  if (totalWeeks <= 1) return [0, 0, Math.max(1, totalWeeks)]
  const foundation = Math.max(1, Math.round(totalWeeks * 0.35))
  const build = Math.max(1, Math.round(totalWeeks * 0.45))
  const finish = Math.max(0, totalWeeks - foundation - build)
  return [foundation, build, finish]
}

export function normalizeGoal(goal = {}, now = Date.now()) {
  const weeksRemaining = resolvedWeeks(goal, now)
  const progress = clamp(Number(goal.progress || 0), 0, 100)
  return {
    id: goal.id || `goal-${now}`,
    title: String(goal.title || 'Mitt mål').trim(),
    target: String(goal.target || '').trim(),
    targetDate: goal.targetDate || null,
    weeks: weeksRemaining,
    progress,
    status: progress >= 100 ? 'completed' : weeksRemaining === 0 ? 'due' : 'active',
    updatedAt: new Date(now).toISOString()
  }
}

export function buildGoalRoadmap(goal, now = Date.now()) {
  const normalized = normalizeGoal(goal, now)
  const [foundationWeeks, buildWeeks, finishWeeks] = splitWeeks(normalized.weeks)
  const phases = [
    {
      id: 'foundation',
      name: 'Grundfas',
      weeks: foundationWeeks,
      focus: 'Skapa en hållbar träningsrytm, stabil teknik och en realistisk basnivå.'
    },
    {
      id: 'build',
      name: 'Utvecklingsfas',
      weeks: buildWeeks,
      focus: 'Öka belastning eller kapacitet gradvis och följ återhämtningen vecka för vecka.'
    },
    {
      id: 'finish',
      name: 'Målfas',
      weeks: finishWeeks,
      focus: 'Behåll kontinuiteten, minska onödiga risker och prioritera det som tydligast för dig mot målet.'
    }
  ].filter(phase => phase.weeks > 0)

  const requiredWeeklyProgress = normalized.weeks > 0
    ? Math.max(0, Math.round((100 - normalized.progress) / normalized.weeks))
    : Math.max(0, 100 - normalized.progress)

  return {
    id: `plan-${normalized.id}-${now}`,
    goalId: normalized.id,
    title: normalized.title,
    target: normalized.target,
    status: normalized.status,
    progress: normalized.progress,
    weeksRemaining: normalized.weeks,
    requiredWeeklyProgress,
    phases,
    weeklyTargets: [
      'Genomför planerade träningspass',
      'Registrera dagsform och återhämtning',
      'Utvärdera progressionen en gång per vecka'
    ],
    createdAt: new Date(now).toISOString()
  }
}

export function evaluateGoalPlan(goal, state = {}, now = Date.now()) {
  const plan = buildGoalRoadmap(goal, now)
  const recentWorkouts = (state.workouts || []).filter(workout => {
    const timestamp = new Date(workout.completedAt || workout.date || 0).getTime()
    return Number.isFinite(timestamp) && timestamp >= now - 7 * DAY_MS
  })

  const alerts = []
  if (plan.status === 'due' && plan.progress < 100) {
    alerts.push('Måldatumet är nått eller passerat. Justera datumet eller definiera nästa delmål.')
  } else if (!recentWorkouts.length) {
    alerts.push('Inget genomfört pass finns registrerat de senaste sju dagarna.')
  }
  if (plan.requiredWeeklyProgress > 15) {
    alerts.push('Målet kräver snabb progression. Överväg längre tidsram eller ett tydligare delmål.')
  }

  return {
    ...plan,
    recentWorkoutCount: recentWorkouts.length,
    alerts
  }
}