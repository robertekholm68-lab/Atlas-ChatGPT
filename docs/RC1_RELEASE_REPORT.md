# ASKR Alpha RC — External Alpha Readiness Review

**Review date:** 2026-07-27
**Target cohort:** 20–50 controlled external testers
**Decision:** ⚠ **Ready with Conditions**

## Executive Summary

The complete repository was reviewed as a release candidate rather than a feature sprint. The deterministic workout, muscle, recovery, health, nutrition, goal, progress, coach, and ASKR coordination engines are separated from React presentation and have broad automated coverage. All 148 tests pass and the production build succeeds.

One Alpha-critical PWA defect was corrected: a first-time installation cached the HTML shell but could omit Vite's hashed JavaScript and CSS because service-worker registration happens after the initial page load. Installation now discovers and pre-caches the production assets referenced by `index.html`; the cache version was advanced so existing installations receive the correction.

No new product functionality, dependencies, visual system, or architecture was introduced. The release is appropriate for a controlled Alpha after the conditions below are completed on the actual HTTPS host and supported devices. It is not yet appropriate for an unrestricted launch.

## Architecture Review

- **Responsibilities and dependency direction:** Domain calculations live under `src/engines`, application coordination under `src/core`, provider integrations under `src/adapters` and `src/platform`, persistence normalization in feature storage/models, and presentation in React components. The reviewed flow maintains the intended inward dependency direction.
- **Engine ownership:** Workout/exercise/muscle calculations, recovery intelligence, health intelligence, nutrition intelligence, goals/progress, coach conversation, and ASKR conflict/safety/decision logic each have explicit entry points and focused tests.
- **Determinism and immutability:** Engine tests cover deterministic output, non-mutation, bounded scores, insufficient-data behavior, future/invalid dates, and memoized selectors/entry points.
- **State and persistence:** Local state parsing is guarded, legacy workout import is duplicate-safe, invalid navigation falls back safely, offline cloud mutations remain queued, and real/demo workout histories remain isolated.
- **React:** Route-level server rendering covers primary modules. No release-blocking render loop or business calculation duplicated into presentation was found.
- **Circular dependencies:** No runtime circular-dependency failure appeared during Vite's full production module transform. A dedicated static cycle gate is not configured and remains recommended.
- **Scope control:** Legacy naming and broad CSS consolidation were deliberately left untouched because changing persistence keys or screen styling in an RC would create more risk than it removes.

## Files Changed

- `public/service-worker.js` — pre-cache the HTML-referenced production assets during installation and advance the shell cache.
- `test/productionPolish.test.js` — regression assertions for production-asset discovery and caching.
- `docs/RC1_RELEASE_REPORT.md` — external Alpha evidence, findings, scorecard, conditions, and decision.

## Critical Issues

### Resolved

- **Offline cold-start could produce a shell without executable assets.** The old install step knew only static shell URLs. Since registration occurs after window load, the first controlled page load is not guaranteed to runtime-cache Vite's hashed JS/CSS. The installer now fetches `index.html`, extracts same-origin root-relative `src`/`href` resources, and atomically caches them with the static shell.

### Open

- None found in the repository-level automated review.

## Major Issues

### Open release conditions

1. **Real-host PWA qualification is outstanding.** Validate install, first offline relaunch, deep-link fallback, service-worker upgrade, and recovery from a failed/partial update on the selected HTTPS host.
2. **Physical-device and assistive-technology QA is outstanding.** Complete workout, nutrition, health/recovery, coach, account/privacy, keyboard-only, VoiceOver, and TalkBack journeys on the supported device matrix.
3. **There is no browser E2E suite.** The model/engine and server-render suite is strong, but it does not drive real pointer, keyboard, focus, storage, service-worker, or multi-screen browser behavior.
4. **Remote coach production controls require deployment verification.** Before enabling remote AI, confirm server-side rate limiting/authentication at the hosting edge, secrets isolation, request logging policy, timeouts, and abuse monitoring. Keep remote AI disabled until those controls are evidenced.

Only these Major conditions block expanding beyond a controlled, monitored Alpha cohort.

## Minor Issues

- Product and diagnostic copy still contains historical `ATLAS` naming. Storage-key renaming is intentionally deferred to a versioned migration to avoid data loss.
- No `lint` or standalone `type-check` script exists. Most application code is JavaScript; TypeScript theme token files are validated indirectly by the Vite build only when imported.
- The manifest supplies one large `any maskable` source image rather than separately optimized platform icon sizes. Confirm safe-zone appearance during device qualification.
- The production bundle remains a single application chunk. It is acceptable for Alpha but should be profiled on constrained devices before deciding whether route/module splitting is warranted.
- Browser-controlled install UI has no custom education flow; this is not required for Alpha functionality.

## Performance Improvements

- The corrected service-worker install makes the complete executable shell available for predictable offline startup rather than relying on a later controlled navigation.
- Current production output is approximately **412.42 kB JavaScript (129.05 kB gzip)** and **106.38 kB CSS (20.61 kB gzip)**.
- Large history tests cover muscle and progress calculations; progress exposes memoization and recovery selectors reuse stable identities.
- No code-splitting or speculative memoization was added without profiling evidence.
- **Still required:** measure startup, interaction latency, long-list scrolling, and workout timer behavior under CPU/network throttling and on low/mid-tier target phones. “60 FPS” cannot be certified from a command-line build.

## UX Improvements

- No redesign was performed. Existing design tokens and the ASKR hierarchy remain unchanged.
- Automated render checks cover primary pages, empty/demo states, missing recovery data, and invalid persisted navigation.
- Connectivity and top-level failure states remain textually communicated and recoverable.
- **Still required:** human review of keyboard occlusion, safe areas, scrolling, focus order, dialog/sheet focus trapping, touch targets, reduced motion, skeleton timing, and one-primary-CTA hierarchy on physical breakpoints.

## Security Review

- The remote AI key remains server-side; the client uses a provider abstraction.
- OpenAI requests explicitly disable provider storage (`store: false`), and conversation tests verify intent-scoped context minimization and identifier/raw-note stripping.
- Coach guardrails reject diagnosis, guarantees, invented measurements, and unsafe recommendations; safety takes precedence in ASKR conflict resolution.
- API errors return generic client messages rather than upstream details.
- No secrets were found in tracked application source during this review.
- **Condition:** production authentication, authorization, CSP/security headers, rate limiting, request-size enforcement at all ingress layers, dependency scanning, and log-retention settings must be validated on the selected deployment platform.

## Privacy Review

- Remote AI is feature-gated and can remain disabled; offline coach fallback is tested.
- Context minimization and explicit coach-memory deletion are covered by automated tests.
- Local persistence tolerates missing/corrupt optional data without sending it remotely.
- **Known gap requiring manual acceptance testing:** end-to-end account export, account deletion, local-data deletion, remote-data deletion, and cross-device deletion propagation depend on configured production services and cannot be certified from the local repository suite.

## PWA Review

- Manifest identity, standalone display, Ink theme/background, language, icon, and maskable purpose are present.
- The service worker now pre-caches the static shell **and** the hashed production JS/CSS referenced by the built HTML.
- Navigation uses a cached `index.html` fallback; successful same-origin assets are runtime-cached; obsolete named caches are removed on activation.
- Registration occurs only in production and failures degrade to an online application rather than breaking startup.
- Root `start_url` and scope require root hosting. Subpath hosting needs an explicit deployment adjustment.
- HTTPS install, platform splash rendering, maskable crop, offline cold start, and update lifecycle remain host/device qualification items.

## Testing Summary

### Passed

- `npm test`: 148/148 passing. Coverage includes engines, state models, null/invalid handling, immutable outputs, large histories, workout/rest flows, nutrition/recovery/health integration, coach safety/offline behavior, platform synchronization, server-render route smoke checks, PWA metadata, and shell resilience.
- `npm run build`: Vite production build successful; 1,891 modules transformed.

### Not available as configured

- Lint: no `lint` script or linter dependency.
- Standalone type-check: no `type-check` script; the codebase is predominantly JavaScript.
- Browser integration/regression/smoke automation: no Playwright/Cypress-equivalent harness.
- Physical-device, installed-PWA, screen-reader, and performance profiling: require the deployment/device test matrix.

## Known Limitations

- Cloud synchronization, wearable sync, account lifecycle, and remote AI need configured external services; local tests exercise abstractions and fallback behavior, not production vendors.
- Offline supports the installed/cached local-first shell. Remote AI and cloud reads require connectivity; queued mutations require a later successful sync.
- Service workers require HTTPS outside browser localhost exemptions.
- Hosting must provide SPA fallback rewrites for direct deep links.
- Sample/demo histories remain intentionally available in Alpha surfaces.

## Technical Debt

1. Add browser E2E journeys for first run, complete workout, rest/restore, completion propagation, meal CRUD/hydration, health entry/sync fallback, coach offline/online, reload, deep links, export, and deletion.
2. Add lint and explicit static type-check gates without broad RC refactoring.
3. Establish versioned persistence migrations before renaming legacy keys.
4. Consolidate legacy CSS onto existing tokens screen-by-screen with approved visual snapshots.
5. Add dependency and circular-import checks to CI.
6. Profile before introducing module-level lazy loading.

## Alpha Readiness Score

| Category | Score / 10 | Rationale |
| --- | ---: | --- |
| Architecture | 9.1 | Clear layered engines and provider boundaries; static cycle gate absent. |
| Performance | 8.5 | Good deterministic large-history coverage and moderate gzip size; device profiling pending. |
| UX | 8.4 | Broad route/state coverage; physical breakpoint and assistive review pending. |
| Workout | 9.3 | Session, set, timer, completion, history, recovery, body, and coach propagation are tested. |
| Recovery | 9.4 | Bounded, explained, immutable intelligence with empty/invalid scenarios. |
| Health | 9.1 | Provider model, storage, score, trends, readiness, and integration are tested. |
| Nutrition | 9.0 | Logging/storage, targets, score, planning, recovery, and coach integration are tested. |
| Coach | 8.9 | Deterministic planning, privacy minimization, safety, memory, and offline fallback; production remote controls pending. |
| PWA | 8.6 | Repository defect fixed; actual install/update/offline lifecycle still needs host/device proof. |
| Accessibility | 7.7 | Semantic automated evidence exists, but no screen-reader/device certification. |
| Testing | 8.5 | 148 deterministic tests and build gate; browser E2E and coverage metrics absent. |
| Security | 8.1 | Sound API boundary and safety defaults; deployment-edge controls not evidenced. |
| Maintainability | 8.8 | Focused engines and tests; legacy naming/CSS and missing lint/type gates remain. |
| **Overall** | **8.7** | Strong controlled-Alpha candidate with explicit deployment and device conditions. |

## Final Decision

# ⚠ Ready with Conditions

ASKR is ready to enter a **controlled external Alpha for 20–50 monitored testers** once the actual HTTPS deployment passes the PWA install/offline/update smoke test, core journeys pass on the supported physical-device/accessibility matrix, and remote AI remains disabled until production security controls are verified.

The decision is conditional rather than unconditional because repository tests cannot prove browser service-worker lifecycle behavior, physical interaction/accessibility, vendor-backed deletion/sync, or deployment-edge security. The deterministic domain foundation is strong, all configured automated gates pass, and the one repository-level Critical PWA issue found in this review has been fixed and regression-protected.
