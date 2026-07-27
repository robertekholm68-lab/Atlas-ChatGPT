export function buildCoachStyle(preferences = {}) {
  const setting = ['flexible', 'balanced', 'strict'].includes(preferences.setting) ? preferences.setting : 'balanced'
  return Object.freeze({ setting, tone: setting, explanationDepth: preferences.explanationDepth || 'concise', directness: preferences.directness || (setting === 'strict' ? 'high' : 'medium'), encouragement: preferences.encouragement || (setting === 'flexible' ? 'high' : 'moderate'), terminology: preferences.terminology || 'plain' })
}
