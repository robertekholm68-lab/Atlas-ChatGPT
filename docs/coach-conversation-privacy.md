# Coach conversation and privacy

ASKR's deterministic engines remain the source of truth. The coach classifies a request, selects only the required domain summaries, obtains current decisions, creates a response plan, formats language, validates it, and returns proposed actions for confirmation. Generated language cannot write application state.

## Local processing

Intent classification, context selection, response planning, guardrails, action validation, deterministic fallback language, and preference memory run locally. The mock provider supports offline explanations, recovery and nutrition guidance, suggested-workout explanations, and weekly-review templates when structured decisions are available.

## Remote processing

Remote AI is disabled by default. Enabling it may send the response plan and the minimal structured context for the active intent. Identifiers, raw medical notes, full history, and unrelated domains are removed. Remote language must pass the same local validation; an invalid response falls back to deterministic output. Users disable remote AI by leaving the provider's `enabled` setting false.

## Storage and control

Raw transcripts are not promoted to permanent preference memory by default. Only user-confirmed supported preferences are stored with source, timestamp, confidence, confirmation status, and category. Memory can be reviewed and removed by identifier. Existing application export and deletion controls remain responsible for local account data.

## Limitations

The coach does not diagnose, guarantee outcomes, or independently calculate workouts and nutrition. Those proposals require connected ASKR decision engines and confirmation. Remote-provider authentication and production consent UI remain deployment responsibilities.
