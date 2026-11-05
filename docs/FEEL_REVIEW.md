# Gameplay-feel return loop — War Dizzles 0.4.0

Date: 5 November 2026, Australia/Adelaide. Independent verifier: `qa_gauntlet`, Lang Systems R12 QA / Reviewer. Production authors: root (controller/interpolation), gameplay (simulation), presentation (rendering). QA owns the added controller/browser tests and this record, not the production implementation.

Verdict: **APPROVE FOR HUMAN ACCEPTANCE** for the reviewed 0.4.0 candidate, cache v9. The reported mouse-button concurrency defect is reproduced and fixed; sniper ADS is now a working magnified optic. Final visible receiver/soldier rework was inspected after the functional gate. No unresolved blocking defect was found in these journeys. This verdict does not assert enjoyment, physical-phone comfort, a guaranteed frame rate or engine parity with a modern 3D shooter.

Reviewed base: `9ca0741` plus the integrated 0.4.0 changes. Final application SHA-256: `8276a509a5d5f5c9e2edc20b2392b47e376b451316056a67af11ca107a07bc89`. As in GAUNTLET_REVIEW.md, this hashes each sorted application filename, NUL, and raw bytes for app.js, game.js, renderer.js, style.css, index.html, sw.js, manifest.webmanifest and the three icons. Raw-byte hashes can differ after checkout newline normalization. Publication identity and deployed checks belong in the delivery owner's release record.

## What the return loop found

The previous smoke checked ordinary fire, HUD state, and multi-touch ownership but did not exercise real held-RMB/LMB chords. Its synthetic controller test emitted two pointerdown events, which is not how a mouse chord behaves. In actual captured Chrome input, holding RMB then pressing LMB for 650ms left marksman ammunition at 10: Pointer Events report pointerdown for the first depressed mouse button, not each button. The opposite release order could also retain the wrong action. Root now handles every mouse button through mousedown/mouseup, keeping aim/fire independent and ignoring touch compatibility mouse events.

Baseline actual W+D with RMB did change the simulated position. QA therefore did not claim a reproduced movement lock. The visible aim presentation and the missing fire chord explained separate parts of the complaint. Baseline marksman ADS had the same small zoom as the other weapons and simply raised the foreground gun; it had no scope mask or calibrated optic. Baseline vertical look moved the image without changing the shot's vertical intersection. These are now separate, executable contracts.

The first functional candidate passed but visible review returned a tall flat ADS receiver and blended double-head soldier silhouettes. Presentation replaced the receiver with the detailed gun, hands and rail beneath a clear sight window, drew one coherent articulated soldier per actor, and extended sleeve bases below the viewport. QA repeated the browser run and inspected the final images. This visible rework was a required gate, not inferred from green tests.

## Executed checks

Local environment: Windows, Node 24.19.0, Playwright 1.64.1 and installed headless Chrome 156.0.8078.80. `npm run verify`: **71 tests passed**, all four production JavaScript syntax checks passed. The optional browser runner remains bounded by a 90-second watchdog.

| Journey | Evidence | Result |
|---|---|---|
| Both real mouse chord orders | Actual pointer lock; RMB→LMB and LMB→RMB for all three weapons; independent releases | PASS; ammunition decreases, correct held action survives each release |
| ADS with walk/strafe/fire | Real W+D and captured mouse input; requestAnimationFrame samples of authoritative position, aim and fire over 350ms per weapon | PASS; movement and fire remain active together throughout |
| Marksman optic | Visible circular peripheral mask, centre reticle and 4x label; no foreground gun; actual canvas mask pixels checked | PASS; screenshots inspected |
| Actual magnification | Controlled imported Game/Renderer scene, same pose and soldier; a test-only magenta calibration mark drawn on that soldier is measured in hip and scoped canvas pixels | PASS; target grows approximately fourfold within the pixel-rounding tolerance, independent of the FOV-helper assertion |
| Other sights | Carbine reflex and SMG open sight; visible receiver/hands beneath the sight, stable centre while walking | PASS; final all-kit images inspected |
| Vertical look / reload | Actual scoped mouse look changes player pitch/yaw; reload exits scope and held RMB returns to scope after magazine refill | PASS; scope/look/reload images inspected |
| Touch ADS | Landscape carbine and portrait marksman: three actual CDP touch pointers move/look/fire concurrently; actual player position, yaw/pitch and ammunition checked | PASS for browser emulation; independent fire-finger release stops firing while aim stays on |
| Display smoothness contract | Controller half-step test checks interpolated render position between unchanged simulation positions; immediate yaw/pitch; stable display object; teleport snap | PASS |
| Bots and soldiers | Steering/target-hysteresis/gait and single-head renderer tests; natural gameplay screenshot sequence and recorded scope movement inspected | PASS for these bounded observations; no subjective combat-quality claim |
| Recovery and distribution regressions | Pause/focus, storage/lock rejection, all three touch viewports, service-worker/offline reload and every manifest icon | PASS; full expanded browser runner reports zero page errors |

The controller snapshots are supplied only by a Playwright response suffix in a service-worker-blocked test context. There is no shipped debug API. Offline checks use a separate unmodified context. The target calibration is a controlled rendering fixture with an explicit test marker, not a natural enemy-engagement claim. No fixture changes enter production assets.

Final screenshots: `C:/Users/langa/AppData/Local/Temp/dub-dizzles-qa-tools/feel-evidence/`, including each kit's hip/ADS, marksman look/reload, portrait scoped movement, and the marked target pair. A short captured-pointer gameplay recording and extracted chronological frames are under `feel-sequence/`; they show hip→scope, diagonal movement with the optic active, then firing reducing ammunition 10→8. These are local QA artifacts and are not served by Pages. The delivery owner's separate Edge and in-app-browser observations must retain their own browser/input limitations.

Separately reported by root: the final expanded script passed installed Edge 156.0.4314.58 with zero page errors after the sleeve fix, including actual capture/both chord orders, all-kit ADS movement, reload, target magnification, portrait touch and offline checks. Root's artifacts are in `C:/Users/langa/AppData/Local/Temp/dub-dizzles-qa-tools/feel-edge-final/`. Root also observed scope/strafe/keyboard firing in the in-app browser, where mouse capture was unavailable and the fallback notice appeared. These observations are attributed to root; independent QA's captured-pointer execution used Chrome.

## Frame scheduling evidence

These are short local desktop workload observations, not isolated workstation benchmarks: another interactive game tab was open during sampling, and some initial samples overlapped QA screenshot work. After the soldier redraw change, 1440×900 live matches held ADS while moving forward and alternating strafe direction. One three-second sample was taken for each weapon/setting. Median interval was 16.7ms in every case.

| Setting / weapon | Frames | p95 interval | Maximum interval |
|---|---:|---:|---:|
| Performance / carbine | 179 | 16.9ms | 33.4ms |
| Performance / SMG | 179 | 16.9ms | 33.4ms |
| Performance / marksman | 180 | 16.8ms | 33.4ms |
| Auto / carbine | 173 | 33.1ms | 33.5ms |
| Auto / SMG | 172 | 17.1ms | 66.7ms |
| Auto / marksman | 175 | 16.9ms | 50.1ms |
| High / carbine | 166 | 33.2ms | 83.2ms |
| High / SMG | 167 | 33.3ms | 66.6ms |
| High / marksman | 170 | 16.9ms | 83.2ms |

High has observable dropped frames in this workload. Performance was the smoothest measured option. These values supersede carrying forward the old cached-sprite renderer's timings; they are not phone/thermal results. No long-run performance guarantee is made.

The next human pass should use real captured mouse input and a physical phone: scope, walk/strafe, fire, release buttons/fingers independently, reload, pause/recover, and judge aiming comfort and enemy readability. The intentionally bounded raycast world still has billboard-style procedural soldiers and a single horizontal play plane. Palette/menu were preserved. Subjective feel and device-specific acceptance remain human judgments rather than agent claims.
