# War Dizzles 0.5.0 release evidence

Date: 5 November 2026, Australia/Adelaide. Operator requested an overnight agent/gameplay gauntlet with trackpad movement as the first priority and ICT-team Easter eggs. Main and public Pages authority persists. Cache generation: `dub-dizzles-v10`.

Candidate includes laptop profile/cruise/trigger controls, independent ADS gain, guarded raw-mouse capture fallback, circular collision and freer ADS motion, bot acquisition/facing tells, original ICT crate/weapon/character art, render-path optimizations and adaptive Auto graphics. Hardware-delivery limits are explicit in the game and handoff; no OS settings are changed.

Independent findings and evidence: [LAPTOP_REVIEW.md](LAPTOP_REVIEW.md). Morning laptop check and controls: [HANDOFF.md](HANDOFF.md).

## Published and verified

- Application commit: `fd56d6e81aac41b74b9defb22a5ce4df94da6c06`. A formatting-only follow-up removed a trailing test-harness blank line; no application bytes changed.
- Published candidate: [`d82c1774a9deecb36cfafe91d9c31b53c550af2b`](https://github.com/langzonedev/DubDizzles/commit/d82c1774a9deecb36cfafe91d9c31b53c550af2b), pushed to main.
- [Verify and publish Pages run 42031505430](https://github.com/langzonedev/DubDizzles/actions/runs/42031505430): **SUCCESS**, verify56s and deploy16s. All92 tests, four production module syntax checks, the full standard browser/offline/touch/scope gate and the new focused laptop/raw-mouse continuous-look gate passed. Screenshots and test-only input evidence are retained as browser-evidence (laptop subdirectory). The preceding application-only run was superseded/cancelled by the formatting follow-up, not accepted as deployment evidence.
- Live URL: https://langzonedev.github.io/DubDizzles/ . Root fetched all ten served application/manifest/icon assets and verified HTTP200 plus exact SHA-256 equality to the published candidate's Git blobs. No test-only controller inspection or event trace is shipped.
- Post-deployment signed Edge156.0.4314.58, fresh browser context: observed v0.5.0/cachev10; used the opt-in menu input checker; obtained actual pointer capture; tapped Q/C/F with no held keyboard keys, observed ADS/cruise/fire, stopped with X and verified ammo ceased; selected Mouse profile, deployed, used W/D+RMB+LMB with two-axis look; paused/returned to menu; disabled network, reloaded the same public path and deployed. **PASS**, zero page runtime errors. Screenshot: workstation C:/Users/langa/AppData/Local/Temp/dub-dizzles-qa-tools/v05-live-laptop.png.
- Root repeated both local gates on signed Edge independently of the focused verifier's Chrome pass. Independent focused Chrome proof, exact artifact paths and qualified frame-timing samples are recorded in LAPTOP_REVIEW.md.

## Exact terminal state

Source is committed, software-input checks pass, public deployment is verified and offline reopening works. This is ready for the next human laptop playtest, not a claim that physical touchpad palm rejection was reproduced or bypassed. Normal WASD plus a trackpad still depends on the OS/driver delivering movement; the game provides a documented Windows setting to try and an alternative without continuous held keys.

No OS preference, driver, security setting, credential or account was changed. Only generic vendor guidance is in the public source; private workstation configuration is not published. The default laptop controls and diagnostic are fully local, with no telemetry or saved event history.

Human owner Greg should follow HANDOFF.md in the morning: test the actual touchpad with and without held keys, try Most sensitive where supported, then compare normal and cruise controls, sights, enemies and collision. Phone comfort, sustained heat, subjective fun and competitive balance remain human/device checks. Rollback uses a source revert plus another worker cache bump and the same verify/browser/deploy route.

The final evidence-only documentation commit uses [skip ci] because served assets are unchanged.
