# ATLAS UI Audit

Date: 2026-07-21
Scope: Frontend application UI only. No backend, API, routing, persistence, workflow, or deployment behavior was changed during this audit.

## Critical

No critical UI inconsistencies were found that prevent the application from rendering or block primary navigation.

## High

1. **Multiple premium visual languages coexist**
   - The rebuilt Home screen uses the latest OLED/lime/cyan premium language, while portions of the Phase 4 training views still mix earlier `.p4-*` styling with later Sprint 1 overrides.
   - Impact: The application can feel like separate products when switching between Intelligence Home and Training.
   - Evidence: `src/intelligence.css`, `src/phase4.css`, `src/workout-polish.css`.

2. **Navigation systems differ between product areas**
   - Intelligence uses a top/sidebar layout plus Home mobile bottom navigation, while Training uses `.p4-sidebar` with a separate mobile dock.
   - Impact: Users relearn navigation patterns when switching modules.
   - Evidence: `src/AppIntelligence.jsx`, `src/AppPhase4.jsx`, `src/intelligence.css`, `src/phase4.css`.

3. **Card implementations are duplicated**
   - `AtlasCard`, Phase 4 `Card`, `.panel`, `.p4-kpi`, `.atlas-card`, and `.atlas-stat-card` overlap in purpose with different padding, radius, hover, and shadow rules.
   - Impact: Future UI work risks drift and duplicated fixes.
   - Evidence: `src/atlasHome.jsx`, `src/AppPhase4.jsx`, `src/intelligence.css`, `src/phase4.css`.

## Medium

1. **Border radius values are inconsistent**
   - Radius values include 9px, 10px, 11px, 12px, 13px, 14px, 15px, 16px, 17px, 18px, 20px, 22px, 24px, 28px, 30px, 38px, and full pills.
   - Impact: The interface feels less systematized outside the rebuilt Home screen.
   - Evidence: `src/intelligence.css`, `src/phase4.css`, `src/appAtlas.css`.

2. **Shadow tokens are fragmented**
   - Several shadow custom properties and one-off shadow declarations coexist: `--atlas-shadow`, `--shadow-premium`, `--shadow`, plus inline component shadows.
   - Impact: Depth and elevation are not predictable across cards, buttons, modals, and navigation.
   - Evidence: `src/intelligence.css`, `src/phase4.css`, `src/appAtlas.css`.

3. **Color variables overlap with similar meanings**
   - The app defines `--atlas-lime`, `--atlas-lime-2`, `--accent`, `--accent-strong`, `--atlas-muted`, `--muted`, `--cyan`, and Home-local variables.
   - Impact: Small hue and contrast differences accumulate between pages.
   - Evidence: `src/intelligence.css`, `src/phase4.css`, `src/styles.css`.

4. **Typography hierarchy is not fully unified**
   - Some pages use large condensed-feeling display headings with aggressive negative letter spacing, while forms, lists, and older panels use smaller default inherited type.
   - Impact: Important areas feel premium, but secondary pages feel more utilitarian.
   - Evidence: `src/intelligence.css`, `src/phase4.css`.

5. **Button variants are duplicated**
   - `.atlas-btn`, `.atlas-button`, `.p4-primary`, `.p4-secondary`, `.p4-icon`, and local button styles repeat variant logic.
   - Impact: Hover, disabled, focus, and active states may diverge.
   - Evidence: `src/atlasHome.jsx`, `src/intelligence.css`, `src/phase4.css`.

## Low

1. **CSS files contain broad global selectors**
   - Selectors such as `.panel`, `.pill`, `.toolbar`, `.segmented`, `.full`, and `.span*` are generic and could collide with future components.
   - Impact: New UI may accidentally inherit unrelated styling.
   - Evidence: `src/phase4.css`.

2. **Some empty states are plain text only**
   - Several empty states use a simple paragraph without iconography, action, or explanation.
   - Impact: Lower perceived polish in sparse-data accounts.
   - Evidence: `src/atlasHome.jsx`, `src/AppPhase4.jsx`.

3. **Mobile breakpoints vary by feature**
   - Breakpoints include 430px, 560px, 720px, 760px, 900px, 980px, and 1100px.
   - Impact: Adjacent modules may change layouts at different viewport widths.
   - Evidence: `src/intelligence.css`, `src/phase4.css`, `src/appAtlas.css`.

4. **Icon sizing is locally decided**
   - Icon sizes are manually specified per component rather than pulled from a small shared scale.
   - Impact: Minor visual rhythm differences between rows, buttons, cards, and nav.
   - Evidence: `src/atlasHome.jsx`, `src/AppIntelligence.jsx`, `src/AppPhase4.jsx`.

5. **Potential unused or legacy CSS remains**
   - Earlier Home styles remain in `src/intelligence.css` before the new Home override block. They are currently superseded by cascade order but should be removed during a cleanup pass.
   - Impact: Larger CSS payload and harder maintenance.
   - Evidence: `src/intelligence.css`.

## Recommended follow-up sequence

1. Extract shared Card, Button, Progress, SectionHeader, and Navigation primitives after the rebuilt Home screen proves the target language.
2. Consolidate color, radius, shadow, and type scales into a small token layer.
3. Rebuild the Workout landing/session screens next, because they are the highest-traffic surfaces after Home.
4. Remove superseded Home CSS once the new implementation has been validated in QA.
5. Standardize responsive breakpoints and mobile navigation behavior across Intelligence and Training.
