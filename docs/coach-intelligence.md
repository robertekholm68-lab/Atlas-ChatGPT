# ASKR Coach Intelligence

## Purpose
Coach Intelligence turns the Coach screen from a generic chat surface into a proactive daily adviser. It produces one structured recommendation that the UI can render before the user asks a question.

## Data sources
The orchestration layer consumes local ASKR state without mutating it:

- Decision Engine: current training, recovery, progress, and risk decisions.
- Recovery Engine: total score and per-muscle readiness values.
- Goal Engine: active goal plan, progress, and alerts.
- Memory Engine: latest workout, training pattern, memories, and personal records.
- Insight Engine: compact coach insights assembled from memories, stored insights, and predictions.
- Prediction Engine: active forecasts when confidence is high enough.

## Recommendation structure
`buildCoachRecommendation(state, now)` returns:

```js
{
  id,
  generatedAt,
  decision,
  headline,
  summary,
  confidence,
  confidenceLabel,
  primaryAction,
  primaryActionLabel,
  primaryActionTarget,
  reasons,
  expectedImpact,
  cautions,
  supportingInsights,
  alternatives,
  dataQuality,
  insufficientData,
  context
}
```

The Coach UI renders this object directly. Recommendation wording is cautious when confidence or data quality is limited.

## Prioritization rules
1. Prefer an existing Decision Engine decision when available.
2. Recovery constraints outrank ordinary training recommendations.
3. Ranked reasons are deduplicated and limited to the clearest 3–5 pieces of evidence.
4. Expected impact is shown only from a Prediction Engine item with sufficient confidence.
5. The primary action is the smallest useful next step and routes only to an existing ASKR screen.

## Confidence and data quality
Data quality is based on available signals: workout history, muscle recovery, current decision, goal/goal plan, memory, and usable predictions. The label is `stark`, `begränsad`, or `otillräcklig`. Confidence combines data quality, decision availability, and prediction confidence; it is not presented as certainty.

## Insufficient-data behavior
When workout and recovery data are missing, ASKR does not fabricate readiness, goals, or predictions. The recommendation becomes an honest setup state that asks the user to log daily form and workouts.

## Event integration
Relevant ASKR events regenerate insights and the coach recommendation after state updates: workout completion, profile update, goal update, recovery update, body measurement update, prediction regeneration, insight regeneration, and daily check-in. Unrelated UI navigation does not dispatch those events.

## UI consumption
The Coach page follows this hierarchy:

1. user context
2. today's decision
3. primary recommendation
4. why this recommendation
5. expected impact when available
6. primary and secondary actions
7. supporting cards
8. chat for follow-up questions

The chat receives the structured recommendation as context when answering follow-up prompts.

## Limitations
The engine is local and deterministic. It does not diagnose medical issues, call external APIs, or replace professional advice. It can only use data already present in ASKR state.

## Future backend / language model connection
A future backend or language model can consume the structured recommendation as trusted context and generate richer conversational explanations. The deterministic engine should remain responsible for selecting the recommendation, evidence, actions, confidence, and data-quality boundaries.
