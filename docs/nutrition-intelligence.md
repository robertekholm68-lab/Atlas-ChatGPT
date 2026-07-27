# Nutrition Intelligence Foundation

Nutrition Intelligence is a deterministic intelligence layer, not a calorie tracker. A normalized `NutritionDay` accepts manual, quick-log, favorite, barcode, recipe, AI-estimate, and saved-meal input while keeping ingestion separate from interpretation.

## Architecture

- `NutritionModels` defines immutable days, meals, sources, types, nutrient targets, and eight representative mock profiles.
- `MealEngine`, `MacroEngine`, `MicroEngine`, and `HydrationEngine` produce focused calculations that can also be consumed independently.
- `NutritionScoreEngine` combines macro balance, protein, fiber, hydration, micronutrients, food quality, and consistency into an explainable 0–100 result.
- `NutritionEngine` composes the domain engines and emits body, recovery, goal, and Coach-facing signals.
- `NutritionInsightsEngine` turns computed facts into short recommendations. It does not make medical diagnoses or call an AI provider.
- `NutritionStorage` is an in-memory adapter with serialization boundaries so browser or cloud persistence can be added without changing consumers.

## Integrations

- **Workout Engine:** meal timing detects pre-workout carbohydrates and post-workout protein.
- **Recovery Engine:** recovery scoring accepts Nutrition Score and exposes protein, hydration, calorie, and timing signals.
- **Health / Body:** body signals expose energy availability, hydration, and nutrition quality without coupling nutrition to presentation.
- **Coach:** structured context and reason codes allow recommendations to explain nutrition support or risk.
- **Goal Engine:** fat loss, maintenance, muscle gain, performance, and recomposition adjust energy and macro targets.

## Sprint 9 seams

Provider adapters can map barcode databases, recipe builders, and AI estimates into `createMeal`. A persistent storage adapter can replace serialization at the application boundary. Dashboard cards can read `macros`, `hydration`, `score`, and `day.meals` directly without duplicating calculations.
