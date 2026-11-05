# Laptop/ICT gauntlet — War Dizzles 0.5.0

Date: 5 November 2026, Australia/Adelaide. This evidence record is compiled by root (R13) from distinct author and verifier outputs. Production authors: root (input/profile/UI), gameplay (simulation), presentation (renderer). Independent focused verifier: laptop_verification (R12), author of tests/laptop.test.mjs and tests/laptop-smoke.cjs, with no production source edits. The earlier qa_gauntlet packet did not produce the final evidence and is not credited with this acceptance.

## Primary issue and honest boundary

The operator repeatedly reported look almost locking during walking on a laptop trackpad. The previous browser pass proved movement/ammunition/aim state, but that did not establish continuous two-axis look during held movement. This iteration explicitly checks delivered yaw and pitch during W/D+ADS+fire and separately checks a no-held-key laptop path.

Microsoft documents Windows Precision Touchpad accidental-activation prevention: some pointer movement and taps can be suppressed after keyboard activity; Most sensitive removes that suppression's timeout. [Vendor source](https://learn.microsoft.com/en-us/windows-hardware/design/component-guidelines/touchpad-tuning-guidelines). This is evidence for a plausible OS cause, not a physical reproduction on this operator's trackpad. A browser cannot invent or restore movement the driver never delivers. No private workstation configuration is published here and no OS/driver setting was changed.

The game therefore provides a practical alternative: Laptop profile, Q aim toggle, C cruise with tapped WASD direction latches, F trigger toggle and X emergency stop. No key needs to remain held during movement/look/fire. Normal held-key controls remain available. Mouse profile requests raw pointer capture with a supported normal fallback; laptop mode keeps adjusted trackpad input. ADS gain is separately adjustable.

The opt-in menu input check counts free vs WASD-held mouse events only. It records no coordinates, text, device identifiers or timings, stores/sends nothing, stops after 30 seconds or on stop/blur/hidden/deploy, and does not infer a diagnosis from counts alone. It helps the human compare deliberate finger movement in both conditions.

## Independently executed controller and browser evidence

Environment: local Windows, Node 24, signed Chrome 156.0.8078.80 and isolated Playwright 1.64.1. Full npm test: 92/92 pass; four production module syntax checks and new test-file syntax checks pass.

Eight new focused VM cases execute the actual controller with multiple event listeners and a minimal DOM. They cover sustained yaw/pitch during held W/D+ADS+fire, no invented look in the absence of events, cruise direction/diagonal latches, keys-released C/Q/F, X/pause/death/blur/hidden cleanup and orphan repeats, independent ADS gain, synchronous/asynchronous raw-capture NotSupported fallback, and optional diagnostic counters/stop conditions.

Actual Chrome browser checks obtained pointer lock and delivered two-axis motion while W/D, RMB and LMB were held. The laptop scenario released every keyboard key, then observed cruise movement, active ADS, trigger ammunition consumption and continued look; a D tap latched the diagonal; X stopped motion/fire. The menu diagnostic counted delivered free and held-key movement and stopped on deploy. These are software-delivery checks, not a physical touchpad simulation.

The actual Mouse/raw profile was selected in the menu and deployed with a real gesture. The test observed the raw-input request, accepted successful raw capture or a normal supported fallback, and required actual world pointer lock within 15 seconds. A twelve-step two-axis mouse sequence during held W/D+ADS+fire changed yaw, pitch, position and ammunition while preserving held actions. No page errors occurred.

Independent latest artifacts: C:/Users/langa/AppData/Local/Temp/dub-dizzles-laptop-V7PWPa, including input-delivery-check.png, laptop-cruise-aim-trigger-look.png, mouse-profile-held-move-aim-fire-look.png, ict-stores-crate-fixture.png and laptop-result.json. Earlier diagnostic artifacts pEjBaQ/lSBfPx are superseded. Screenshot fixtures position a real Game/Renderer deliberately to inspect ICT art; they are not naturally played footage.

## Gameplay and visible review

Gameplay author: circular collision/full-vector sliding, actual-travel movement feedback, immediate ADS stop/reverse, carbine/SMG/marksman-specific aimed speeds, enemy acquisition/facing lead and hit/readiness metadata. Six added mechanics cases pass. Author-run 48 seeded rounds (16 per skill, 120Hz) all ended within 300 simulated seconds without invalid positions/headings. Crew outcomes were asymmetric; this is completion/collision evidence, not competitive-balance or enjoyment proof.

Presentation author: original ICT shipment, Dell-text RMA, server, patch-panel and ticket materials; crew/character and gun material refinements; visible readiness/hit cues. An actual root walkthrough found south-facing labels mirrored. The author corrected texture orientation, added a four-face regression, and rendered/inspected all four directions in Chrome; root independently inspected the readable south-face DELL/RMA result. No downloaded brand art or third-party game assets were used.

Render work now caches rays, coalesces visible sprite spans, and simplifies expensive decoration. Auto quality reduces internal resolution only after sustained frame pressure, respects cooldown/bounds, and recovers slowly. Tests cover four-FPS pressure, single-stall rejection, fixed explicit quality, settled ADS cache reuse and wall-label orientation. Root supplies actual frame elapsed time; no input deltas are discarded to improve rendering metrics.

Root's additional in-app-browser walkthrough observed the laptop profile, Q/C/F with all keys released, visible cruise/trigger status and ammunition falling, then X and Escape stopped/paused. Pointer capture was denied there and its explicit fallback was observed. That observation is separate from signed Chrome's actual-capture evidence. Root closed the tab before any performance measurement.

## Gate recommendation and remaining conditions

Independent focused verifier recommendation: PASS / ready for CI at the stated software-input scope. Root integration accepts this for publication only after the complete standard browser/offline/touch gate, focused laptop gate and deployment/live asset checks pass. RELEASE_0.5.0.md records those later outcomes.

Physical trackpad palm rejection, the effect of a user's Windows/OEM settings, phone comfort, heat and subjective game feel remain human acceptance checks. The next morning route is in HANDOFF.md. Do not describe this release as a verified hardware-level fix or guaranteed frame rate. No account, telemetry, purchase, server or OS-setting surface was added.


Root integration recheck: the full existing desktop/touch/scope/chord/offline/icon gauntlet and the focused laptop gauntlet both PASS on signed Edge 156.0.4314.58 with zero page errors. Root evidence is separate from the independent Chrome result: C:/Users/langa/AppData/Local/Temp/dub-dizzles-qa-tools/v05-edge and v05-laptop-edge. Both profile modes obtained actual capture; raw profile requested unadjusted input, and held movement plus delivered yaw/pitch/ADS/fire remained concurrent. No physical trackpad inference is made from these automated events.


## Root frame-timing sample

After closing the manual test tab and both verification browsers, root ran one six-second local signed Edge 156.0.4314.58 sample per quality at 1440x900, holding W/D, Q aiming and ArrowRight turning. Performance: 359 frames, median16.7ms, p9516.8ms, max43.0ms, buffer480x300. Auto:361 frames, median16.7ms, p9516.8ms, max17.1ms, buffer759x474, scale1. High:361 frames, median16.7ms, p9516.8ms, max17.0ms, buffer960x600. Each context was fresh and closed afterward; the measurement script was v05-performance.cjs in temporary tools, not shipped code.

These are observed workstation/browser scheduling samples, not a guaranteed game FPS, controlled before/after comparison, phone benchmark or sustained thermal test. Auto did not need to downscale during these short samples; its pressure/recovery behavior is covered separately by renderer tests. The Performance startup outlier is retained rather than hidden.
