const DEFAULT_MUSCLES = [
  ['chest','Chest','front',72,28,['Bench press','Incline press']],['front-delts','Front delts','front',61,39,['Overhead press','Bench press']],['biceps','Biceps','front',84,16,['Curls','Pull-downs']],['forearms','Forearms','front',78,22,['Rows','Carries']],['core','Core','front',66,34,['Plank','Cable crunch']],['quads','Quads','front',44,56,['Squat','Leg press']],['adductors','Adductors','front',73,27,['Lunges']],['calves','Calves','side',58,42,['Calf raise','Running']],['traps','Traps','back',69,31,['Rows','Shrugs']],['rear-delts','Rear delts','back',76,24,['Face pulls']],['lats','Lats','back',52,48,['Pull-ups','Rows']],['triceps','Triceps','back',63,37,['Pushdown','Bench press']],['lower-back','Lower back','back',39,61,['Deadlift','Back extension']],['glutes','Glutes','back',47,53,['Hip thrust','Squat']],['hamstrings','Hamstrings','back',42,58,['RDL','Leg curl']],['side-hip','Side hip','side',71,29,['Lateral lunge','Abduction']]
]

export const recoveryStatuses = [
  { id: 'fresh', label: 'Fresh', min: 85 },
  { id: 'light', label: 'Light fatigue', min: 70 },
  { id: 'moderate', label: 'Moderate fatigue', min: 55 },
  { id: 'heavy', label: 'Heavy fatigue', min: 40 },
  { id: 'overtrained', label: 'Overtrained', min: 0 },
  { id: 'recovering', label: 'Recovering', min: 0 }
]

function clamp(value, min = 0, max = 100) {
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : min
}

export function recoveryStatus(score, fatigue = 0) {
  if (fatigue > 52 && score >= 40) return recoveryStatuses[5]
  return recoveryStatuses.find(status => score >= status.min)?.id || 'overtrained'
}

export function readinessState(score) {
  if (score >= 85) return 'Excellent'
  if (score >= 72) return 'Good'
  if (score >= 58) return 'Moderate'
  if (score >= 42) return 'Low'
  return 'Recovery Needed'
}

export function buildRecoveryPlatformModel(core = {}) {
  const coreMuscles = core.recovery?.muscles || {}
  const muscles = DEFAULT_MUSCLES.map(([id, name, view, fallbackScore, fallbackFatigue, exercises]) => {
    const coreEntry = coreMuscles[name] || coreMuscles[id]
    const fatigue = Math.round(clamp(coreEntry?.fatigue ?? fallbackFatigue))
    const score = Math.round(clamp(coreEntry ? 100 - fatigue : fallbackScore))
    const hoursRemaining = Math.max(0, Math.round((fatigue / 100) * 72))
    return {
      id, name, view, score, fatigue, hoursRemaining, status: recoveryStatus(score, fatigue),
      recentExercises: exercises,
      trainingLoad: Math.round(clamp(fatigue * 1.18)),
      volumeHistory: [score - 12, score - 6, score - 9, score - 2, score].map(item => Math.round(clamp(item))),
      suggestedExercises: score > 70 ? ['Normal progression', 'Technique top set'] : ['Mobility flow', 'Low-load pump work'],
      suggestedRest: hoursRemaining ? `${hoursRemaining} hours before heavy loading` : 'Ready for normal training',
      notes: coreEntry ? 'Connected to completed workout recovery engine.' : 'Placeholder until enough training history exists.'
    }
  })
  const score = Math.round(clamp(core.recovery?.score ?? muscles.reduce((sum, muscle) => sum + muscle.score, 0) / muscles.length))
  const limiting = [...muscles].sort((a, b) => a.score - b.score).slice(0, 3)
  const workouts = core.workouts || []
  const reasons = [
    `${limiting[0].name} ${limiting[0].status.replace('-', ' ')}`,
    workouts[0]?.name ? `Recent ${workouts[0].name} session` : 'Workout load placeholder active',
    'Sleep quality placeholder awaiting wearable data',
    'Protein and hydration impact prepared for nutrition data'
  ]
  return {
    score,
    readiness: readinessState(score),
    recommendation: score >= 72 ? 'Train harder where muscles are fresh' : score >= 55 ? 'Maintain with controlled volume' : score >= 42 ? 'Recover and deload intense work' : 'Rest today',
    reasons,
    muscles,
    limiting,
    workouts: workouts.slice(0, 4),
    weeklyTrend: [64, 71, 58, 76, 82, 69, score],
    timeline: ['Yesterday', 'Today', 'Tomorrow'].map((day, index) => ({
      day,
      workout: index === 0 ? 'Workout recovery started' : index === 1 ? 'Maintain or deload based on target muscle' : 'Projected freshness improves',
      nutrition: index === 0 ? 'Protein impact placeholder' : 'Recovery meals and calories tracked',
      sleep: 'Sleep duration, quality, deep, REM, restlessness and debt placeholders',
      hydration: index === 1 ? 'Hydration status needs log' : 'Hydration recovery placeholder',
      ai: 'AI recommendation placeholder'
    })),
    history: { weeklyAverage: Math.round((64 + 71 + 58 + 76 + 82 + 69 + score) / 7), monthlyTrend: '+6%', trainingConsistency: '4 / 5 planned sessions', recoveryConsistency: '82%', milestones: ['First deload window identified', 'Chest recovered notification ready'] },
    integrations: {
      nutrition: ['Protein', 'Calories', 'Hydration', 'Meal timing', 'Recovery meals', 'Supplements placeholder'],
      sleep: ['Duration', 'Quality', 'Deep sleep', 'REM', 'Restlessness', 'Sleep debt', 'Wearables'],
      heart: ['Resting HR', 'HRV', 'Heart rate recovery', 'Stress', 'Body Battery', 'Garmin', 'Apple Health', 'Google Fit'],
      ai: ['Training suggestions', 'Rest suggestions', 'Nutrition suggestions', 'Sleep suggestions', 'Hydration suggestions'],
      notifications: ['Legs recovered', 'Chest still fatigued', 'Drink more water', 'Protein target missed', 'Recovery improving', 'Ready for heavy workout']
    }
  }
}
