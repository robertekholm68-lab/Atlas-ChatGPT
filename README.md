# ASKR

ASKR is a premium, local-first fitness and health application. The current alpha release candidate combines workout planning and logging, deterministic coaching, body and recovery intelligence, nutrition views, progress history, and an optional cloud platform adapter.

## Developer setup

### Requirements

- Node.js 22 or newer
- npm 10 or newer

### Start locally

```bash
npm ci
npm run dev
```

Vite prints the local development URL. The optional coach API proxy can be started separately with `npm run api:dev` after copying `.env.example` to `.env.local` and supplying the required values.

### Quality checks

```bash
npm test
npm run build
git diff --check
```

There is currently no separate lint or static type-check script. Tests use Node's built-in test runner, and Vite creates the production bundle in `dist/`.

## Architecture

ASKR keeps calculations outside React:

- `src/engines/` contains deterministic workout, recovery, muscle, goal, coach, and progress engines.
- `src/core/` coordinates application state, decisions, events, memory, and offline synchronization.
- `src/*Model.js` modules normalize and persist feature state.
- React screens and platforms in `src/` consume engine/model output and own presentation state only.
- `src/theme/` is the shared design-token source for color, type, spacing, radius, border, and motion values.
- `src/platform/` contains optional production/cloud service adapters and sync UI.
- `public/` contains brand assets, the PWA manifest, and the offline service worker.
- `test/` exercises engines, models, platform behavior, and server rendering of primary routes.

Additional engine documentation is available in `docs/INTELLIGENCE-ENGINE.md`, `docs/coach-intelligence.md`, `docs/prediction-engine.md`, and `docs/recovery-engine.md`.

## Design

The implementation source of truth is `docs/design/DESIGN_RULES.md`; the visual reference is `docs/design/ASKR_Brand_Style_Guide.pdf`. ASKR uses Ink surfaces, Bone text, and Volt only for primary actions, progress, active states, and key metrics. Shared spacing follows the 4-point scale and standard motion is 150 ms ease-out with reduced-motion support.

## PWA and deployment

`npm run build` produces a deployable single-page application. Production hosts must rewrite unknown application routes to `/index.html` so refreshes and deep links resolve. The service worker supplies the cached application shell when navigation is offline; fetched same-origin assets are cached after first use. Serve the build over HTTPS for installation and service-worker support.

If deploying below a subpath, set `VITE_BASE_PATH` and update the manifest scope/start URL for that deployment target.

## Contributing

1. Keep each change focused and preserve the existing architecture.
2. Put business and calculation logic in engines/models, not React components.
3. Reuse shared components and theme tokens; do not add colors, typography, or dependencies without an explicit requirement.
4. Preserve accessibility, keyboard behavior, reduced motion, and 44 px minimum interactive targets.
5. Run all quality checks above and document unrelated issues rather than expanding the change.
6. Include a concise summary, modified files, build/lint status, observations, and relevant UI screenshots in the pull request.

## Release status

RC1 production-polish findings, validation coverage, known limitations, and the recommended beta roadmap are recorded in `docs/RC1_RELEASE_REPORT.md`.
