# ASKR Alpha RC1 Release Report

Date: 2026-07-27

## Release scope

RC1 is a production-polish milestone, not a feature release. The pass preserved the existing React, model, engine, and platform architecture while completing the installable/offline shell, resilient top-level failure handling, network-state communication, application identity metadata, primary module navigation semantics, and developer/release documentation.

## Performance summary

- The production build completes successfully and generates a single 395 kB JavaScript entry (approximately 123 kB gzip) and a 104 kB stylesheet (approximately 20 kB gzip).
- Expensive progress intelligence already exposes a memoized entry point and is covered by deterministic large-history tests.
- Static brand imagery is lazy-loaded where rendered through `AtlasAsset`.
- No browser profiler was available in the validation environment, so 60 FPS on physical small Android, iPhone, and tablet hardware remains a device-QA requirement.
- A future split of module-level bundles is recommended because all primary platforms currently share one entry bundle. This is optimization work, not an RC1 blocker at the current compressed size.

## Architecture summary

ASKR remains layered:

1. deterministic domain calculations in `src/engines/`;
2. application state, events, decisions, memory, and synchronization in `src/core/`;
3. persistence and view normalization in feature models;
4. React presentation and interaction state in screens/platform components;
5. provider-neutral cloud and AI adapters behind platform/service boundaries.

RC1 adds only platform-shell concerns: the error boundary, connectivity status, web manifest, and service worker. It adds no fitness business logic to React.

## Screens reviewed

Automated server-render coverage exercises the Home/dashboard, programs, exercise library, calendar, history, statistics/progress, food, recovery/body intelligence, coach, active-workout landing, nutrition, recovery platform, and cloud platform routes. Complete workout session behavior, rest controls, completion persistence, recovery calculations, coach decisions, history/progress calculations, empty data, corrupt persisted data parsing, and offline synchronization queues are covered by the test suite.

The global module switch was reviewed at desktop and compact mobile breakpoints for minimum target size, horizontal overflow, focus visibility, semantic current-page state, and reduced motion. Physical-device and assistive-technology testing remains outstanding.

## Reliability and PWA status

- A top-level error boundary prevents a render failure from leaving a blank application and offers a safe reload path.
- Corrupt optional legacy state remains isolated by existing guarded persistence parsing.
- Offline state is communicated in text, not color alone, while local workflows remain available.
- Invalid persisted module navigation now falls back to Training instead of rendering an empty shell, and recovery status remains explicitly unavailable until real recovery data has been calculated.
- The manifest defines standalone presentation, ASKR identity, Ink theme/background, and an any/maskable square brand icon.
- The service worker pre-caches the shell, removes superseded caches, falls back to the shell for offline navigation/deep links, and runtime-caches successful same-origin assets.
- Hosting still must provide SPA fallback rewrites to `index.html`; this cannot be made provider-specific without a selected deployment target.

## Remaining bugs and observations

- Product copy still contains legacy `ATLAS` naming in some historical feature surfaces and storage keys. A wholesale rename was intentionally avoided because it would enlarge risk and could break persisted data compatibility.
- The visual audit in `UI_AUDIT.md` identifies legacy styles that predate the current ASKR design rules. Consolidating them requires screen-by-screen visual regression approval rather than a risky release-candidate rewrite.
- Several demo histories and dated sample records remain visible by design in alpha builds.
- No lint or standalone type-check command exists in `package.json`; build and 109 automated tests are the available repository-wide gates.

## Known limitations

- Install prompts are browser-controlled; ASKR supplies installability metadata but does not add a custom prompt.
- Offline mode covers the previously loaded local-first application shell and assets. Cloud/AI requests require connectivity and queued cloud mutations depend on configured services.
- Service workers and installation require HTTPS (except browser localhost exemptions).
- The manifest uses root scope. Subpath deployments must provide deployment-specific scope/start URL values.
- Desktop/tablet/mobile visual capture, screen-reader passes, keyboard-only journey testing, and CPU-throttled frame profiling require browser/device QA outside the current command-line environment.

## Recommended beta roadmap

1. Run a formal device matrix on small/large Android, iPhone, tablet portrait/landscape, and installed standalone mode.
2. Complete VoiceOver/TalkBack and keyboard-only audits for workout logging, dialogs, bottom navigation, body selection, and coach composition.
3. Add browser E2E coverage for first launch, complete workout, reload/deep link, offline launch, update recovery, and install qualification.
4. Consolidate legacy CSS onto the existing token system one screen at a time with approved visual snapshots; do not redesign.
5. Add module-level lazy loading only after profiling confirms a meaningful first-load improvement.
6. Choose a production host, add its SPA rewrite configuration, and validate HTTPS install/update behavior plus QR destination.
7. Define supported data migration/versioning before removing any legacy ATLAS storage keys.

## Release recommendation

RC1 is suitable for controlled alpha tester distribution after production hosting is selected and smoke-tested. It should not be represented as broadly production-ready until the physical-device, accessibility, install/update, and browser-performance checks above are completed.
