# War Dizzles 0.4.0 release evidence

Date: 5 November 2026, Australia/Adelaide. Existing operator authority covers main and public Pages publication; this increment follows the requested combat-feel agent gauntlet. Cache: `dub-dizzles-v9`.

Candidate: proper 4x sniper scope, distinct carbine/SMG sights, independent mouse chord controls, responsive simultaneous walking/strafe ADS, angular pitch/hit alignment, smooth display interpolation and enemy movement/animation. Palette, deployment menu, local progress identity and public-only boundaries are preserved.

Independent acceptance evidence: [FEEL_REVIEW.md](FEEL_REVIEW.md). Human route and recovery: [HANDOFF.md](HANDOFF.md).

## Published and verified

- Application changes: `68ea0e882928a4f6788c658e599bf8857c71851e`. Subsequent commits changed only test tooling and review evidence; application bytes/cache identity were preserved.
- Published candidate: [`f98e814dba6bf0b1a01381c882e486e60aaf523b`](https://github.com/langzonedev/DubDizzles/commit/f98e814dba6bf0b1a01381c882e486e60aaf523b), `main`.
- [Verify and publish Pages run 42025089413](https://github.com/langzonedev/DubDizzles/actions/runs/42025089413): **SUCCESS**. Verify passed in 1m13s; deployment passed in 14s. All 71 mechanics/controller/renderer/worker tests, four module syntax checks and the expanded real-browser gauntlet passed. Browser screenshots and mouse traces are attached to the run as browser-evidence.
- CI used regular Chromium `156.0.8078.4` in new headless mode. The unchanged strict no-warp test showed all three weapons at pitch 0 before/after RMB and yaw pi/2 before/after RMB. Both mouse chord orders, independent releases, ADS movement/fire, actual pixel magnification, angular pitch bounds, reload/scope reentry, portrait sniper multi-touch, responsive controls and offline icons passed.
- Live URL: https://langzonedev.github.io/DubDizzles/ . Root verified HTTP 200 and exact SHA-256 equality to the published Git blobs for all ten served application/manifest/icon assets, including the changed controller, simulation, renderer, CSS, HTML and worker. Test-only inspection/event tracing is not shipped.
- Post-deployment fresh local headless Edge `156.0.4314.58`: observed v0.4.0/cache v9, obtained actual mouse capture, selected the sniper, verified its dark peripheral optic mask, held RMB then LMB together with W/D, observed ammunition consumption, released primary while retaining ADS and verified ammunition stopped, reloaded, paused/returned to menu, then disabled network and reloaded/deployed from the public URL. **PASS**, zero page runtime errors. Screenshot: `C:/Users/langa/AppData/Local/Temp/dub-dizzles-qa-tools/feel-edge-final/live-scope.png`.

## Gauntlet returns before publication

Run 42022620877 rejected a fixed wall-clock reload delay on the slower Linux runner. The browser test now waits for bounded observable state and measures concurrent actions over simulation time; a full local signed Chrome run passed at 4x CPU throttling.

Runs 42023371153 and 42024618828 exposed a Linux headless-shell mouse-input artifact. The captured trace showed an unsolicited movement of -1065/-789 pixels, exactly the menu pointer's displacement to the origin, after RMB without any commanded move. The game correctly processed those delivered movement deltas. Windows installed Chrome did not reproduce it. The strict camera-stability assertion remained blocking, and no production mouse filter or relaxed assertion was added.

The default test binary was changed from the separate headless shell to regular Chromium's new headless mode, matching the browser family used by signed Chrome/Edge. The same strict Linux gate then passed with zero pitch/yaw warp. This establishes the observed difference between these tested binaries; it is not a claim about every Linux browser or the upstream root cause. The failed runs never deployed. Details and the official browser-mode reference are in FEEL_REVIEW.md.

## Terminal state and next owner

The application is committed, independently reviewed, CI-verified, deployed and live-smoke-verified. There are no open blocking findings from this loop. The final documentation-only evidence commit uses [skip ci] because it changes no served application bytes.

Greg owns the next human playtest: scope comfort, gun feel, enemy readability and physical-phone controls/thermal behaviour. Emulation, workstation timing and automated rounds do not certify those human/device outcomes. Optional High graphics exhibited dropped frames in the recorded local workload; Performance was the smoothest measured setting. Rollback and the exact human route are in HANDOFF.md.
