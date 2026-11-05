# Independent polish gauntlet — 5 November 2026

Verdict: **APPROVE FOR HUMAN ACCEPTANCE**, scoped to the v0.3.0 source and local Chrome browser evidence below. No unresolved release-blocking code defect was found in this bounded static solo-game scope. Physical-phone comfort, sustained thermal performance and subjective enjoyment remain human acceptance work. Production deployment is the delivery owner's separate evidence gate.

Verifier: `qa_gauntlet`, applying Lang Systems R12 QA Engineer / Reviewer and R06 public-boundary review. Production implementation was authored by root, gameplay and presentation agents. QA authored controller/worker regressions and the optional browser harness; these tests are not a claim of independent authorship of the game. Core QA, Reviewer and shared operating-standard instructions were read.

Reviewed input: base commit `6b85c64f4d23a3789efd475428d6f4dbdc5d32dc` plus the integrated v0.3.0 working tree, cache generation v8. Candidate application digest SHA-256: `8ee1d5bc7f5f761f1839c7a6f39ba30e9a2417ec9c00e41acce5837bbd376f5d`. Digest concatenates sorted filenames, a NUL separator, then each file's raw bytes for app.js, game.js, renderer.js, style.css, index.html, sw.js, manifest.webmanifest, icon.svg, icon-192.png and icon-512.png. It identifies the locally reviewed assets; Git checkout newline normalization can change raw-byte digests. The release commit and CI/deployment run belong in HANDOFF.md.

## Executed evidence

| Acceptance | Method and environment | Result |
|---|---|---|
| AC02–AC04, AC14 | Windows local headless Chrome 156.0.8078.80, Playwright 1.64.1, 1440×900: menu, deploy, fire, reload, pause, keyboard focus cycle | PASS; no page/console errors |
| AC03–AC07, AC12, AC15 | Node 24.19.0, `npm run verify`: syntax of four production modules; 53 mechanics/controller/worker tests | PASS; includes full deterministic round, rival victory, death/redeploy, fresh restart, rejected storage/lock, frame-rate cadence, fixed-step movement and interruption |
| AC07–AC09, AC14 | Chrome touch emulation at 390×844, 844×390 and 320×740; all action buttons and pause inside viewport and at least 44×44 CSS pixels; fire taps; pause | PASS for emulation; screenshots inspected |
| AC08 | Chrome CDP landscape: three simultaneous touch pointers on stick/look/fire, drag movement/look, release fire finger independently, verify ammunition stops decreasing | PASS; browser input emulation, not real touch hardware |
| AC08 | Controller regressions: immediate touch shot, second-finger ownership rejection, lost capture, vertical rejected-lock drag, mouse cancellation, hybrid mouse/touch release | PASS |
| AC10 | Fresh online worker registration, controlled reload, network disabled, reload same `/DubDizzles/` path, deploy; fetch each manifest icon while offline | PASS including SVG and both PNG icons |
| AC11 | Worker unit tests: complete-bundle install, failed install rejection, namespace-only cleanup, foreign app/origin and non-GET bypass, cache-first fallback | PASS |
| AC11 | Isolated local Chrome update fixture, same worker algorithm with cache suffix changed qa-a→qa-b: active-match DOM sentinel and HUD survived; unrelated-app cached sentinel survived; subsequent offline reload worked | PASS for this controlled update scenario; not a production upgrade observation |
| AC13 | Normal/reduced-motion Chrome rendering fixture: actual imported Game/Renderer, fixed camera/shot/damage state, before/after screenshots inspected; source review of static blast and hidden screen damage/hit flash | PASS for observed rendering and source contract |
| AC16 | Source and network-boundary review: relative local assets, procedural original art, textContent feed, no accounts/telemetry/purchases/server or third-party game downloads; Pages artifact allowlist reviewed | PASS in this client-only scope |
| AC01 | Published URL / deployed artifact | Delivery owner must record post-push HTTP/CI/runtime evidence separately |

The optional reproducible browser runner is `tests/browser-smoke.cjs`. It serves the real application under `/DubDizzles/` with an ephemeral localhost port, uses temporary fresh browser contexts, saves screenshots, and fails after 90 seconds. Set PLAYWRIGHT_MODULE to an external Playwright module path and optionally BROWSER_EXECUTABLE to installed Chrome/Edge; no package is added to the runtime application. CI uses its own installed Chromium. Scripts, tests, docs and temporary evidence are not in the public application artifact.

Local screenshot set: `C:/Users/langa/AppData/Local/Temp/dub-dizzles-qa-tools/final-evidence/` contains desktop/portrait/landscape/narrow menu/game images plus `combat-no-preference.png` and `combat-reduce.png`. These paths are workstation evidence, not repository or deployed assets. The combat fixture uses a deliberately supplied simulation state to inspect renderer feedback; it is not a naturally played combat recording.

## Rework and convergence

The initial Windows run failed six controller cases because the VM harness removed LF imports but not CRLF imports. The portable stripper now passes on this checkout. Root added angleDiff to the controller; QA updated its explicit injected imports accordingly.

QA returned modal focus escape, missing vertical fallback look, touch-only handling on hybrid Windows hardware, mutable-device-mode mouse release, and reduced-motion screen/blast flashes. Their cause owners corrected them and affected tests/browser checks were repeated. An intermediate multi-touch test initially supplied the wrong changed-touch list to CDP; recorded pointer events established the harness mistake, which was corrected before the successful independent-release check. The manifest's generated display-name encoding was corrected by root after source review.

Gameplay author regressions also cover frame-dependent fire cadence, anti-tunnelling, ray range bounds, objective navigation with fortified centre, bot separation, invalid deltas, reload notification, objective-notice throttling, sprint shot taps and accuracy accounting. QA inspected the final production diff and reran the combined suite.

## Performance evidence and limits

Final local headless Chrome, 1440×900, stationary six-second live-match requestAnimationFrame samples, one run per setting: Performance yielded 361 frames, median 16.7ms, p95 16.9ms, maximum 17.8ms; High yielded 355 frames, median 16.7ms, p95 16.9ms, maximum 66.9ms. The high-setting outlier remains visible in the record. This is workstation/browser scheduling evidence, not a guaranteed game FPS, full-round stress result, phone benchmark or thermal result. Prefer Performance on constrained devices.

Human handoff: play two rounds on Windows with actual pointer capture, then a physical phone in portrait/landscape with independent move/look/fire, interruption/recovery and offline reopening. Judge aiming comfort, readable HUD, pacing and enjoyment. Installation/launcher behavior varies by browser and has not been verified on physical hardware. Multiple simultaneous game tabs still use a client-owned local wallet without cross-tab conflict coordination; there is no real-money value or competitive authority.

Final readability recheck: QA reran the complete Chrome browser smoke and all 53 checks after the CSS/HTML label-size and faction-name changes. The 390×844, 844×390 and 320×740 screenshots were inspected; primary actions, vitals and objective remain usable and action targets stay in bounds. Approval includes these latest assets and the digest above.

Separately recorded delivery-owner evidence: root reported a second run of the same final browser harness using installed Edge 156.0.4314.58, PASS with zero page errors, including all three touch viewports, three-finger ownership and offline icons. Evidence directory: C:/Users/langa/AppData/Local/Temp/dub-dizzles-qa-tools/edge-evidence/. This Edge result is root's runtime observation; the independent QA execution above used Chrome.
