# War Dizzles 0.3.0 — human playtest handoff

Date: 5 November 2026 (Australia/Adelaide). Target: `langzonedev/DubDizzles`, `main`, public GitHub Pages. Greg authorised main commits and publication; the current request explicitly authorised the parallel agent gauntlet. Team ownership and Core references are in [AGENT_TEAM.md](AGENT_TEAM.md); independent results are in [GAUNTLET_REVIEW.md](GAUNTLET_REVIEW.md).

Play: https://langzonedev.github.io/DubDizzles/

## Delivered

- Fixed-step simulation and consistent automatic-fire cadence; a short trigger tap interrupts sprint immediately.
- Collision-safe movement, softer squad separation and navigation that survives cover in the objective centre.
- Original shot streaks/impacts and directional incoming-fire cues, capture-zone ground markings and a clearer tactical map.
- Objective distance/bearing/presence, nearby supply/cooldown prompts, round clock, kill confirmation and accuracy in the result report.
- Aspect-preserving rendering with bounded portrait/landscape pixel budgets, throttled HUD/map work and reusable audio samples.
- Independent touch ownership/cancellation, hybrid touchscreen-laptop mouse support, touch sprint and vertical drag-look fallback.
- Keyboard-contained, inert-background pause and reduced-motion feedback alternatives.
- PNG install icons, refreshed offline cache v8 and a real-browser gate in the publishing workflow.

Existing wallet/settings identities, per-life costs, free fallback and original public-only assets are preserved. The shipped game has no dependencies, accounts, telemetry, purchases, multiplayer or server.

## Verification and publication

Run `npm run verify` for syntax and mechanics/controller/worker checks. Run `node tests/browser-smoke.cjs` using the isolated Playwright setup in README for desktop play, keyboard pause, touch viewports, screenshots and offline reload. Browser and CI evidence belongs to the release commit, not to this document's claims alone. See the independent review for exact results and limits.

The Pages workflow must pass both automated and real-browser checks before packaging only application assets. Its browser screenshots are retained as the `browser-evidence` artifact. Publication commit, Actions run and post-deployment observations will be recorded in [RELEASE_0.3.0.md](RELEASE_0.3.0.md) after deployment.

## Next human session — Greg

1. On Windows Chrome/Edge, play two rounds. Check mouse capture, movement, aim, sprint-to-fire, reload, cover/grenades, supplies, threat cues, objective clarity, death/redeploy and result/restart. Try Escape/Tab pause and keyboard resume.
2. On a physical phone, try portrait and landscape. Move/look/fire together, push fully forward to sprint, release fingers independently and test all actions. Interrupt the browser, resume and judge readable HUD, comfort and sustained heat/battery use.
3. After an online visit completes caching, disable connectivity and reload the same Pages URL. Complete a round. Reconnect, refresh when an update is available, and try installation if offered.

Physical touch comfort, thermal behaviour and enjoyment require this human session. Browser emulation and deterministic rounds establish specific technical behaviour, not those subjective/device outcomes. No claim of universal-browser or AAA feature parity is made.

## Recovery and operations

The game is a static solo arena. Local cash/best use `dub-dizzles-profile`; preferences use `war-dizzles-settings`. Denied storage falls back to the session. Clearing site data resets those values and offline availability; concurrent game tabs do not coordinate the wallet. No local value is real money or a trusted competitive score.

Updates cache the whole bundle before activating and never force an active page reload. Refresh loads the latest code; existing pages may keep running their loaded version. Cache cleanup targets only `dub-dizzles-` caches and preserves other apps on the shared origin. Roll back with a normal revert, increment the worker cache generation again and let the same verify/browser/deploy gates run. Validate the reverted live page and offline reload.

## Learning captured

Cross-platform test harnesses must tolerate CRLF as well as LF. Capability detection must not equate touch hardware with exclusively touch input. Fire cadence must preserve fractional timing instead of quantising to render frames. Renderer quality must bound both aspect and total pixels. Offline/update claims need real worker execution as well as lifecycle unit tests. These product lessons are retained in the QA review; the pre-existing modified Core working tree was preserved without importing private source or changing other repositories.
