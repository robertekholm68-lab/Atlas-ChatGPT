# ATLAS UI Sprint 1A — Home / Today screen

## Screen hierarchy
1. **App header** — compact ATLAS mark, Today label and profile/avatar access.
2. **Contextual greeting** — time-aware Swedish greeting and first name when the recommendation/profile exposes one.
3. **Today's primary decision** — dominant `DAGENS BESLUT` card driven by Coach Intelligence recommendation fields.
4. **Daily status** — compact metrics for only available recovery, sleep, energy, motivation and weekly completion values.
5. **Muscle / recovery overview** — uses ATLAS Core muscle recovery values and keeps the existing premium body-map direction deferred rather than replacing it with generic art.
6. **Today's workout** — workout card sourced from the current recommendation/decision and routed through known existing app pages.
7. **Weekly overview** — lightweight progress toward the available weekly target.
8. **Latest activity** — latest completed workout from Coach/Core context, otherwise an honest empty state.
9. **Bottom navigation** — fixed mobile navigation with safe-area padding, lime active state and labelled tap targets.

## Design tokens used
Home-specific values are centralized in `atlasHomeTokens` and mirrored as CSS custom properties in `intelligence.css`:

- OLED background: `#030504`
- Layered surfaces: `#0b1411`, `#111d18`
- Text: `#f4faf7`
- Muted text: `#8ea19a`
- Lime accent: `#b8ff46`
- Warning/danger: `#ff9f43`, `#ff5f57`
- Radius: `22px` card radius, `15px` control radius
- Shadow: deep premium card shadow
- Motion: short 180 ms interactions; disabled under `prefers-reduced-motion`

## Components created
- `AtlasHomeScreen`
- `AtlasCard`
- `AtlasPrimaryButton`
- `AtlasSecondaryButton`
- `AtlasProgress`
- `AtlasBottomNavigation`
- `buildHomeViewModel` / `safeHomeTarget` data helpers

## Data sources by section
- Greeting: Coach Intelligence `recommendation.context.firstName`, profile fallback.
- Primary decision: `buildCoachRecommendation(core)` or stored `core.coach.recommendation`.
- Daily status: Atlas Core recovery score, local check-in values and Coach context weekly completion.
- Muscle/recovery: `core.recovery.muscles` fatigue converted to readiness.
- Today's workout: Coach recommendation decision/headline/message.
- Weekly overview: Coach context weekly completion and profile/goal weekly target when present.
- Latest activity: Coach context latest workout, profile core summary or Core workouts fallback.

## Responsive behavior
The implementation is mobile-first for 360–430 px widths. Cards stack vertically, metrics use a two-column mobile grid, long Swedish text wraps naturally, and the main content receives extra bottom padding so the fixed navigation does not cover content. Tablet/desktop widths use a restrained centered grid without redesigning other pages.

## Empty states
- Missing daily check-in values are hidden rather than fabricated.
- Missing muscle recovery shows: “Ingen lokal muskelåterhämtning loggad ännu.”
- Missing latest workout shows: “Inget genomfört pass finns sparat ännu.”
- Insufficient data keeps Coach Intelligence's insufficient-data copy.

## Reference mockup assumptions
The supplied Home mockup is treated as the visual source for hierarchy, OLED/charcoal layering, lime emphasis, large condensed-feeling heading scale, rounded premium cards, understated shadows and mobile bottom navigation. Exact body-map artwork is preserved as a product direction and not replaced in this sprint because the available Home data model currently exposes muscle recovery values, while the detailed artwork remains in the existing body/recovery UI.

## Intentionally deferred
- Full cross-app component library.
- Redesign of Coach, Goal, Recovery, Decision History or Settings pages.
- New AI engines or replacement business logic.
- New generic body diagrams or emoji-based recovery art.
- Deep workout-detail routing beyond existing safe page targets.

## Manual visual QA checklist
- [ ] 360 px width: no horizontal scroll; cards stack; bottom nav does not overlap content.
- [ ] 390 px width: decision card hierarchy matches mockup proportions.
- [ ] 430 px width: metrics remain readable with comfortable tap targets.
- [ ] Desktop width: layout remains centered and usable without SaaS-dashboard feel.
- [ ] Populated state: all sections show real Core/Coach data.
- [ ] Insufficient-data state: empty states are honest and no invented values appear.
- [ ] Long Swedish text: headings/body text wrap without clipping.
- [ ] Bottom-navigation overlap: final card can scroll above nav and safe area.
- [ ] Reduced motion: transitions and entrance animation are disabled.
