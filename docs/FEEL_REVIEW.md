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
| ADS with walk/strafe/fire | Real W+D and captured mouse input; requestAnimationFrame samples of authoritative position, aim and fire over 0.35 simulation seconds per weapon, bounded by 10 seconds wall time | PASS; movement and fire remain active together throughout |
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

## Browser-gate timing correction

The delivery owner reported Linux CI run `42022620877` failing the old smoke assertion that a reload must have completed after a fixed 2.2 seconds of wall time. The bounded game loop can advance less simulation time on a slow software-rendered browser. QA corrected the test timing without changing production assets, cache identity or gameplay rules.

Reloads now wait for observable completion, with a 15-second wall limit. Optic settlement and mouse capture use observable state with a 10-second limit. Concurrent movement/fire samples cover 0.35 or 0.4 seconds of actual simulation, checking that aim and fire remain held in every sample; failure to progress within 10 wall seconds rejects the run. Independent fire release is checked for a complete weapon firing interval plus 50ms of simulation, rather than a short fixed sleep. Service-worker readiness is also bounded. The 90-second total watchdog remains active.

Executed recheck: full expanded Chrome 156.0.8078.80 smoke **PASS**, zero page errors, with test-only CDP CPU throttling set to **4×** on every page, including the unmodified offline-check page. Artifacts: `C:/Users/langa/AppData/Local/Temp/dub-dizzles-qa-tools/timing-throttle4/`. This establishes the revised waits under the stated artificial slowdown; it is not a real slow-device performance result or a claim that the Linux CI rerun has passed. The delivery owner must record that rerun separately.

## Captured-input environment diagnosis

CI run `42023371153` subsequently found the look assertion already starting at the positive pitch clamp. QA changed the commanded look probe to use known pointer coordinates and move away from both limits. In local captured Chrome at 4× CPU throttling, real input reached +0.65 and −0.65, then 24px probes moved pitch to +0.6349938 and −0.63499997 respectively, with approximately +0.015 yaw change each. No Game state was reset. Capture/bubble event traces and pose snapshots are retained in each kit's mouse-trace JSON and marksman-pitch-probes.json.

The strict gate also requires a plain RMB press, without commanded mouse movement, to preserve pitch/yaw. Traces are written before that assertion, so an unexplained jump blocks publication rather than being hidden by the clamp-aware probe. Windows Chrome at 4× showed unchanged zero pitch and unchanged yaw for every weapon's initial RMB press.

The delivery owner inspected diagnostic Linux run `42024618828`: a zero-delta mousePressed event was followed about 43ms later by an unsolicited mousemove with movement −1065/−789, client/screen position 0/0 and buttons 0. The displacement matched the deployment-button coordinates; pitch jumped 0→0.65 and yaw about 1.5708→−1.0917. This differs from the Windows input trace and points to the Linux headless-shell/virtual-input path; physical Linux input behavior has not been established by this fixture.

The browser runner now selects `channel: 'chromium'` when an explicit installed-browser executable is not supplied. This uses regular Chromium's new headless mode, which Playwright distinguishes from its separate headless-shell binary; branded Chrome/Edge use the newer mode as well. [Playwright browser documentation](https://playwright.dev/docs/browsers#chromium-new-headless-mode) supports this environment choice. Production input is unchanged: no delta filter or event-dropping workaround was added. The no-warp assertion, traces, captured-input probes and other gates remain active. The Linux regular-Chromium rerun must pass before publication; this diagnosis alone does not close that runtime gate.

Local fallback-mode attempt: Playwright regular Chromium 156.0.8078.4 downloaded on Windows, but process creation failed with `spawn UNKNOWN` before a browser session existed. No bundled-browser runtime result is claimed from that attempt. The executed local results above used installed Chrome/Edge; the Linux CI rerun determines the bundled regular-Chromium result.

## Final verification closure

**APPROVE FOR HUMAN ACCEPTANCE — Linux browser gate resolved.** This closure supersedes the pending-rerun language above. The delivery owner inspected [CI run 42025089413](https://github.com/langzonedev/DubDizzles/actions/runs/42025089413): verify and deploy succeeded using regular Chromium 156.0.8078.4 on Linux. All three weapons' retained traces show initial RMB pitch 0→0 and yaw π/2→π/2; the same strict no-warp assertion and full gameplay gate passed. The environment change did not relax assertions or alter production input. The earlier origin-warp finding applies to the observed headless-shell CI configuration, not universally to Linux or headless browsers.

Separately recorded delivery-owner evidence: deployed War Dizzles 0.4.0/cache v9 passed live Edge 156.0.4314.58 checks for actual mouse capture, scope, RMB+LMB with W/D, independent release, reload, pause and offline reload, with zero page errors. The delivery owner also matched all ten served application assets' SHA-256 values against their bytes in commit `f98e814`. Production assets remained unchanged through the test-environment corrections.

QA's independently executed Windows checks and retained input/projection regressions, together with the delivery-owner-inspected Linux CI and deployed-runtime evidence, support this scoped closure. The final release record owns the complete commit/publication identity. Physical-phone comfort, subjective feel and sustained device-specific performance remain the next human acceptance pass; no additional source or test changes were required for this closure.
