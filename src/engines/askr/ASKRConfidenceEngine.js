const qualityValue = { excellent: 1, good: 0.85, limited: 0.65, stale: 0.4, conflicting: 0.35, missing: 0.25 }
export function calculateConfidence({ context, signals }) {
  const relevant = [...new Set(signals.map(signal => signal.domain))]
  const quality = relevant.length ? relevant.reduce((sum, domain) => sum + qualityValue[context.dataQuality[domain]], 0) / relevant.length : 0.35
  const reliability = signals.length ? signals.reduce((sum, signal) => sum + signal.confidence, 0) / signals.length : 0.4
  const directions = signals.map(signal => signal.recommendation).filter(Boolean)
  const agreement = directions.length < 2 ? 0.8 : Math.max(...directions.map(value => directions.filter(item => item === value).length)) / directions.length
  const maturity = Math.min(1, (context.trainingHistory.length + context.userFeedback.length) / 20)
  const score = Math.max(0.2, Math.min(0.98, quality * 0.3 + reliability * 0.3 + agreement * 0.25 + maturity * 0.15))
  const missingData = Object.entries(context.dataQuality).filter(([, value]) => value === 'missing').map(([domain]) => domain)
  return { score: Number(score.toFixed(2)), category: score >= 0.8 ? 'high' : score >= 0.6 ? 'moderate' : 'limited', missingData, limitingFactors: [...(quality < 0.6 ? ['data_quality'] : []), ...(agreement < 0.6 ? ['signal_disagreement'] : []), ...(maturity < 0.5 ? ['baseline_maturity'] : [])] }
}
