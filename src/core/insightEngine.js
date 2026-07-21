export function selectAtlasInsights(state = {}) {
  const coachInsights = state.coach?.insights || []
  const memories = state.memory?.memories || []
  const predictions = state.predictions?.items || []
  return [
    ...coachInsights.map(item => ({ ...item, source: item.source || 'coach' })),
    ...memories.map(item => ({ id: item.id, title: item.title, detail: item.detail, confidence: item.confidence, source: 'memory', type: item.type })),
    ...predictions.filter(item => item.status === 'active').map(item => ({ id: item.id, title: item.title, detail: item.recommendation || item.description, confidence: item.confidence, source: 'prediction', type: item.type, category: item.category }))
  ].filter(item => item.title || item.detail)
}

export function refreshAtlasInsights(state = {}) {
  return {
    ...state,
    coach: {
      ...(state.coach || {}),
      insights: selectAtlasInsights(state).slice(0, 20)
    }
  }
}
