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

## Sprint 9 meal intelligence

- `RecipeEngine` normalizes recipes, applies calorie, protein, time, cuisine, budget, diet, and allergy filters, then ranks safe matches against favorite and disliked foods.
- `MealRecommendationEngine` calculates remaining macros, adapts carbohydrate demand after harder workouts, and supplies pre-workout, post-workout, hydration, and electrolyte guidance.
- `MealPlannerEngine` builds a deterministic seven-day, family-sized plan from matching recipes and scheduled workouts.
- `ShoppingEngine` consolidates the plan's ingredients and groups the resulting grocery list by category.
- `EnergyBalanceEngine` combines intake, basal expenditure, activity, and thermic effect to expose daily balance, weekly trend, and an explicitly predicted—not measured—body-weight forecast.

`buildNutritionIntelligence` composes all five engines. Recipe-backed planning remains optional, so existing logging consumers do not need recipe data. Its `coachContext` now includes energy balance, meal suggestions, nutrition gaps, and recovery actions. Engines stay deterministic and provider-independent; an AI adapter can explain or rephrase their structured output without owning nutrition calculations.

## Phase 4 boundary

Provider adapters can map barcode databases and AI estimates into `createMeal` or normalized recipes. Persistence can replace the existing serialization boundary without changing engine consumers. Phase 4 UI cards can read `mealPlan`, `shoppingList`, `energyBalance`, `recoverySupport`, and `coachContext` directly without duplicating calculations.
