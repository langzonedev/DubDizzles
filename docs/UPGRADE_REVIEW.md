# War Dizzles 0.2.0 independent source and simulation review

Review date: 5 November 2026. Reviewer: separate QA execution from the app, renderer, UI and simulation authors. Scope: current upgrade working tree, reviewed before publication. This report records source/simulation evidence only; the release owner records browser and deployment evidence separately.

## Executed evidence

- `npm test`: 34/34 passed after final fixes (25 mechanics, 6 controller/input and 3 service-worker lifecycle tests).
- `node --check app.js`, `renderer.js`, `game.js`, `sw.js`: passed.
- Additional independent seeded simulation: 60 unattended matches across easy/normal/hard, every match ended within 205 simulation seconds; no living bot had nonfinite coordinates or intersected solid world geometry.
- DOM contract inspection: no duplicate IDs. Literal app references resolve, including the added labelled stamina display with a maximum of 100.

Controller tests execute the actual `app.js` with the real simulation and a minimal DOM/API harness. They verify simultaneous primary-fire/aim release, pause freezing and held-input clearing, a fresh simulation after an ended round, malformed and primitive settings recovery, unavailable storage and pointer-lock fallback, and independent touch cancellation/hidden-tab movement reset. The renderer and browser APIs are mocked, so these tests do not establish visual, audio, physical-touch or browser acceptance.

## Findings and disposition

| Finding | Severity | Disposition at review |
| --- | --- | --- |
| Releasing the right mouse button stopped held left-button fire | Medium | Fixed by owner; actual handler regression test passes |
| Valid JSON primitive settings could throw on preference changes | Medium | Fixed by owner; malformed/null/array/primitive recovery tests pass |
| Holding sprint at exhausted stamina toggles sprint every 1–2 frames | Medium | Fixed with an exhaustion latch and recovery threshold of 20; independent rerun of regression test passes |
| Enemy muzzle flashes bypass reduced-motion preference | Low | Fixed; source now gates both enemy and player muzzle flashes on the reduced-motion preference |
| New stamina mechanic lacks a visible stamina display | Low | Fixed; labelled SPRINT progress display now exposes stamina on the HUD |
| Precision-aim viewmodel sights were offset from the central reticle | Product limitation | Fixed in source with per-kit sight offsets interpolated to viewport centre; this remains an illustrated viewmodel and hitscan simulation |

## Boundaries and performance inspection

Renderer materials and soldier sprites are original local procedural art. Material creation occurs once; soldier variants are cached in a finite team/phase/facing set (up to 36 canvases). Ejected casing lifetime is bounded to 0.65 seconds. No added network asset fetches, accounts, remote execution, telemetry, purchases, backend or dependencies were found in the reviewed source. Local profile key remains unchanged and the documented per-life loadout economy is preserved.

Navigation now reuses a flow field and invalidates it after successful construction or cover destruction. Independent regression checks cover invalidation and traversability. The renderer still uses a single-height raycast world with billboard soldiers and illustrated viewmodels; the update should not be described as a full polygonal 3D engine conversion.

Floor sampling and increased resolution add per-frame CPU work, especially High quality in portrait orientation. Final source uses sampling steps of 8/6/4 for Performance/Auto/High and caps portrait buffer height at approximately 1280 pixels for ordinary phone aspect ratios. Source inspection cannot establish frame rate, battery consumption or thermal comfort. Remote-browser smoke tests, actual phone controls/performance, full offline reload and update migration remain separate evidence gates. Human playtesting is still needed to judge whether combat is enjoyable and balanced.

## Release status

Final source and simulation re-review passes: all actionable findings above are resolved, and the final 34-test suite and JavaScript syntax checks were independently rerun successfully. The delivery owner reports remote desktop-browser observations of the menu, live firing and reload; those observations are attributed to the owner and are not an independent device test by this reviewer. The owner must verify the published revision and record deployment evidence before representing publication as complete. Physical-device and full offline acceptance remain explicitly pending until observed.

## Final update-lifecycle follow-up

The delivery owner observed an older cached release persisting in the remote browser. Independent follow-up review inspected cache v7 and reran all 34 tests successfully. `skipWaiting()` now runs only after the complete refreshed asset bundle has been precached; a rejected cache install prevents activation. Activation deletes only older `dub-dizzles-` caches and claims clients without a forced page navigation. The three lifecycle tests cover success ordering, failed-install rejection and app-scoped cleanup/claim. These are worker-API harness tests; they do not establish a full offline reload on a physical device. The current already-loaded match keeps its JavaScript until the next normal reload.

The initial player heading now points along the spawn lane (`Math.PI/2`); the controller fallback test checks actual displacement without depending on heading. Renderer source now resets ammo comparison, casings and recoil on a new game identity, preventing a smaller selected magazine from being mistaken for a shot. Syntax checks for the changed worker, renderer and simulation pass. No new blocker found in this follow-up.
