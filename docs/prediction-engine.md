# ATLAS Prediction Engine

The local Prediction Engine creates cautious, explainable projections from data already stored in ATLAS. It is deterministic, does not call external APIs or language models, and never treats projections as facts.

## Supported predictions

- **Goal timeline** estimates a target date for measurable goals when the goal target can be matched to body weight, body-fat percentage, or waist measurement history.
- **Trend projection** estimates near-term direction for body measurements and training frequency.
- **Plateau risk** flags possible flat progress when workout activity continues without a clear progression signal.
- **Consistency forecast** estimates whether recent training frequency is likely to continue over the next 28 days.
- **Recovery risk** flags probable short-term recovery pressure from recovery score and fatigued muscles. This is not a medical diagnosis.
- **Scenario comparison** compares simple local scenarios such as current behavior, one additional workout per week, one missed workout per week, or changed completion rate.

## Input requirements and thresholds

Minimum observations are intentionally conservative:

| Prediction | Minimum local data |
| --- | --- |
| Body metric trend | 4 dated observations |
| Workout trend | 6 dated workouts |
| Goal timeline | 4 dated matching metric observations and numeric target |
| Exercise performance trend | 4 observations when future UI provides per-exercise series |
| Plateau risk | 6 workouts |
| Consistency forecast | 6 workouts |
| Recovery risk | 2 recent workouts or a low recovery score |

When `includeInsufficient` is passed, the engine returns a structured `insufficient-data` item instead of a fabricated projection.

## Confidence calculation

Confidence is a number from `0` to `1`. It declines for small sample sizes, stale latest observations, volatile measurements, and longer prediction horizons. Recent intervals are weighted more strongly, while daily rates are capped to limit extreme projections.

## Assumptions and limitations

Every prediction includes `assumptions` and `evidence`. Wording uses terms such as “estimated”, “likely”, and “based on your recent data”. Predictions are planning aids only and are not guarantees, medical advice, or diagnoses.

## State structure

`atlasStore` persists:

```js
predictions: {
  generatedAt: null,
  items: [],
  scenarios: []
}
```

Legacy saved state is normalized by merging missing prediction fields from the default state.

## Event integration

Predictions regenerate only after relevant events: finished workouts, profile/body-measurement updates, goal updates, and recovery updates. Unrelated events keep the existing prediction state.

## Future UI and Coach Intelligence consumption

Dashboard UI should show only active predictions with confidence labels and evidence summaries. Coach Intelligence should reference prediction `description`, `assumptions`, `evidence`, and `recommendation` so advice remains explainable and conservative.
