# Recovery intelligence engine

`src/engines/RecoveryEngine.js` is a deterministic, side-effect-free decision layer. It accepts already aggregated muscle history, calculates per-muscle recovery, summarizes whole-body fatigue, and ranks supported workout splits. It has no React, browser, storage, or LLM dependency.

## Architecture

1. `calculateMuscleRecovery` converts effective sets, weekly tonnage, frequency, fatigue multiplier, and elapsed hours into `recoveryPercentage`, `status`, and `recommendedWait` (hours).
2. `evaluateMuscleRecovery` applies that calculation to every configured muscle threshold.
3. `calculateOverallFatigue` averages muscle readiness and returns complementary readiness/fatigue percentages.
4. `generateWorkoutRecommendation` applies safety gates for MRV and fatigue, then ranks Push, Pull, Legs, Upper, and Lower by average muscle readiness.
5. `buildRecoveryIntelligence` composes the functions into the public result shape.

All percentages are clamped to 0–100. Missing history is treated as recovered. Invalid and negative numeric inputs are safely normalized. The model is heuristic rather than medical advice; its constants are deliberately visible and testable.

## API examples

```js
import { calculateMuscleRecovery, buildRecoveryIntelligence } from './src/engines/index.js'

calculateMuscleRecovery({
  effectiveSets: 12,
  weeklyVolume: 7200,
  trainingFrequency: 2,
  fatigueMultiplier: 1.15,
  timeSinceLastWorkout: 30,
  thresholds: { mev: 8, mav: 16, mrv: 22 },
})

buildRecoveryIntelligence({
  chest: {
    weeklyEffectiveSets: 12,
    weeklyVolume: 7200,
    frequency: 2,
    fatigueMultiplier: 1.15,
    lastTrained: '2026-07-24T06:00:00.000Z',
  },
}, new Date('2026-07-25T12:00:00.000Z'))
```

## Remaining work for Sprint 3

- Calibrate recovery constants against longitudinal athlete data and per-user baselines.
- Add sleep, soreness, stress, and readiness feedback when those signals become available.
- Connect the pure engine to the application data adapter and recommendation UI.
- Track recommendation acceptance and completed-workout outcomes without coupling analytics to this engine.
- Add goal, schedule, equipment, injury, and exercise-selection constraints to the planning layer.
