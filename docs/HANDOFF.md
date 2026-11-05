# War Dizzles 0.4.0 — combat-feel handoff

Date: 5 November 2026 (Australia/Adelaide). The operator requested another agent gameplay gauntlet after observing absent sniper optics, sluggish walking ADS and janky guns/enemies. Main/Pages authority and public browser-only boundaries remain unchanged. The original palette and deployment menu are preserved.

Play: https://langzonedev.github.io/DubDizzles/

## This pass

- Genuine 4x sniper optic, circular peripheral mask and calibrated reticle; gun hidden once scoped.
- Distinct carbine reflex and SMG open sights, steadier ADS and magnification-scaled look sensitivity.
- Fixed actual mouse-button chord handling: aim then fire, or fire then aim; independent releases work while walking/strafing.
- Angular vertical aiming now affects direct hits and shot effects; camera and reticle share the same projection.
- Faster aimed walking/strafing with a smaller precision penalty; smooth display interpolation while player look remains immediate.
- Smoother bot turning, acceleration, target selection, navigation and continuous distance-driven leg animation.

Independent findings, test totals and browser evidence: [FEEL_REVIEW.md](FEEL_REVIEW.md). Publication evidence: [RELEASE_0.4.0.md](RELEASE_0.4.0.md). Previous release records remain in RELEASE_0.3.0.md and GAUNTLET_REVIEW.md.

## Human acceptance route

1. Pick Long Distance HR. Hold RMB or press Q: a real 4x optic replaces the foreground gun. Aim at enemies at different heights; check that the visible reticle predicts hits.
2. Hold W/D while aiming and firing. Try RMB then LMB, reverse the order, and release each independently. Reload while holding aim; scope should leave during reload and return afterward.
3. Try the carbine and SMG sights, judge weapon visibility, turning sensitivity and strafing comfort. Watch nearby enemies turn and walk, then play a complete round and restart.
4. On a physical phone, toggle AIM and move/look/fire with separate fingers. Try portrait/landscape, interruption/resume, reload and offline reopening. Human comfort, sustained heat and subjective enjoyment remain open; browser emulation cannot certify them.

## Operations and recovery

Run npm run verify; CI also runs tests/browser-smoke.cjs with isolated Playwright tools before Pages publication. Only the static application assets ship; no accounts, telemetry, purchases, third-party game assets or server were introduced. Local wallet/settings and per-life costs are unchanged.

Cache generation is dub-dizzles-v9. The complete bundle installs before activation, preserves other apps' caches, and never forces an active match reload. Refresh to load the new version. Existing loaded pages may keep their prior version until refreshed. To roll back, revert the application commit, increment the worker cache again, let verify/browser/deploy complete, and inspect the live game plus offline reload. Local wallet is client-owned and not real money or an authoritative competitive record.

## Learning

Test actual mouse-button chords, not just synthetic pointerdown events. Verify the visible optic, target magnification and reticle alignment, not just an aiming boolean. Separate simulation timing from display interpolation. Use explicit UTF-8 when authoring cross-platform source files. These lessons are recorded with the concrete defects and checks in the independent feel review.
