export const coachPersonalities = Object.freeze({
  supportive: { id: 'supportive', label: 'Supportive', tone: 'warm', coachingBias: 'reassure', promptContract: 'Guide with empathy and confidence.' },
  balanced: { id: 'balanced', label: 'Balanced', tone: 'clear', coachingBias: 'prioritize', promptContract: 'Balance motivation, constraints and evidence.' },
  strict: { id: 'strict', label: 'Strict', tone: 'direct', coachingBias: 'accountability', promptContract: 'Be direct, standards-led and action oriented.' },
  scientific: { id: 'scientific', label: 'Scientific', tone: 'evidence', coachingBias: 'explain', promptContract: 'Explain the physiology and cite structured signals.' },
  minimal: { id: 'minimal', label: 'Minimal', tone: 'concise', coachingBias: 'focus', promptContract: 'Use few words and one next action.' },
  motivational: { id: 'motivational', label: 'Motivational', tone: 'energizing', coachingBias: 'momentum', promptContract: 'Build confidence and reinforce identity.' }
})

export const goalTypes = Object.freeze(['weight_loss', 'muscle_gain', 'strength', 'running', 'general_fitness', 'body_recomposition', 'custom'])

export const coachMemorySchema = Object.freeze({
  userPreferences: [], workoutHistory: [], nutritionHabits: [], recoveryTrends: [], favoriteExercises: [], goals: [], restrictions: [], personalNotes: [], conversationMemory: []
})

export function buildCoachContext(core = {}, profile = {}) {
  return {
    generatedAt: new Date().toISOString(),
    profile: { name: profile.name || 'Robert', experience: profile.experience || 'intermediate' },
    goals: core.goals || profile.goals || [{ type: 'body_recomposition', title: 'Body recomposition', progress: 64 }],
    preferences: profile.preferences || { personality: 'balanced', units: 'metric' },
    workoutPlatform: { workouts: core.workouts || [], latestWorkout: (core.workouts || [])[0] || null, weeklyCompletion: Math.min(5, (core.workouts || []).length) },
    nutritionPlatform: core.nutrition || { proteinAdherence: 78, calorieAdherence: 86, hydration: 62 },
    recoveryPlatform: core.recovery || { score: 82, sleep: 7.4, fatigue: 'moderate' },
    progressPlatform: core.progress || { strengthTrend: 'up', bodyTrend: 'stable', consistencyTrend: 'steady' },
    memory: { ...coachMemorySchema, ...(core.memory || {}) }
  }
}

export function createDecisionModel(context) {
  return {
    id: `decision-${context.generatedAt}`,
    inputs: ['workout_history', 'recovery', 'nutrition', 'sleep', 'consistency', 'goals', 'body_measurements', 'prs', 'fatigue', 'mood_placeholder', 'stress_placeholder'],
    outputSlots: ['training_recommendation', 'nutrition_recommendation', 'recovery_recommendation', 'risk_flags', 'confidence'],
    confidence: 0.74,
    status: 'architecture_ready'
  }
}

export function buildCoachPlatformViewModel(core = {}, profile = {}) {
  const context = buildCoachContext(core, profile)
  const decisionModel = createDecisionModel(context)
  const readiness = Number(context.recoveryPlatform.score || 82)
  const consistency = Math.min(100, 70 + Number(context.workoutPlatform.weeklyCompletion || 0) * 5)
  return {
    context,
    decisionModel,
    dashboard: {
      recommendation: readiness >= 75 ? 'Train with intent today; keep two reps in reserve on heavy sets.' : 'Prioritize recovery and technique until readiness rebounds.',
      readinessSummary: `${readiness}% readiness with stable recovery signals`,
      training: readiness >= 75 ? 'Lower body strength is the best fit today.' : 'Mobility, walking and light accessories.',
      nutrition: 'Anchor the next meal around protein, plants and hydration.',
      recovery: 'Keep bedtime consistent and add 8–10 minutes of downregulation.',
      goalProgress: 64,
      priorities: ['Complete the planned session', 'Hit protein target', 'Hydrate before 16:00'],
      consistency,
      insights: ['Strength trend is improving', 'Protein adherence is improving', 'Sleep consistency is the next unlock'],
      actions: ['Start recommended workout', 'Log next meal', 'Open daily brief']
    },
    dailyBrief: ['Workout recommendation', 'Recovery summary', 'Nutrition advice', 'Hydration reminder', 'Motivation', 'Upcoming milestones', 'Warnings', "Today's focus"],
    timeline: [
      ['Workout completed', 'Upper strength logged', 'training'], ['Protein missed', '18g below target yesterday', 'nutrition'], ['Recovery improving', 'Readiness up 6%', 'recovery'], ['Goal milestone', '64% toward active goal', 'goal'], ['AI recommendation', 'Lower strength today', 'coach']
    ],
    recommendations: ['Train legs today', 'Rest chest', 'Increase protein', 'Reduce volume', 'Increase calories', 'Drink more water', 'Walk today', 'Stretch shoulders', 'Deload week'],
    analyses: ['Strength improving', 'Volume increasing', 'Consistency steady', 'Recovery improving', 'Protein improving', 'Sleep trend needs attention'],
    notifications: ['Ready for PR', 'Recovery complete', 'Protein low', 'Missed workout', 'Goal milestone', 'Hydration reminder', 'Weekly review'],
    weeklyReview: ['Training summary', 'Nutrition summary', 'Recovery summary', 'Consistency', 'Achievements', 'Challenges', 'Suggested focus', 'Motivational summary'],
    monthlyReview: ['Progress', 'Body changes', 'Strength changes', 'Training load', 'Nutrition adherence', 'Recovery trends', 'Goal progress', 'Future AI summary']
  }
}
