# Human handoff — War Dizzles v0.1.1

## What is ready

User approved implementation, main pushes and public GitHub Pages operation on 5 November 2026. A buildless, original solo FPS is implemented: procedural raycast yard, three teams with 12 bots, capture-zone scoring, faction combat, loadouts, cash rewards, cover placement/destruction, grenades, reload, resupply, respawn, match result/restart, desktop and touch controls, local progression, optional synthetic audio, pause and offline service worker.

This is an initial playable alpha. It does not implement every WARDOGS feature: no multiplayer, vehicles, vertical terrain, jumping/crouching, destructible buildings or large-scale simulation. Browser-only/offline needs justify the deliberately bounded first release. No claim of universal-browser or physical mobile acceptance is made.

## Verification evidence

- Independent QA agent: 17 Node mechanics tests PASS, including a full unattended deterministic round, hostile damage/death, rival victory, reload, hitscan occlusion, economy, cover, supplies, grenades and restart.
- Owner: syntax checks PASS for application modules, renderer and service worker.
- Independent UX/CISO source review: touch fire-pointer coupling and paused Space handling identified and corrected. No high-severity finding in this client-only scope. See QA_SECURITY_REVIEW.md and UX_REVIEW.md.
- Runtime browser, pointer capture, audio, real touch, offline reload, installability and production URL: PENDING. Remote browser cannot reach this workspace's loopback; GitHub browser session is signed out. These are evidence limits, not tests passed.

## First publication

1. Open repository Settings → Pages. Set **Build and deployment → Source → GitHub Actions**.
2. Run **Actions → Verify and publish Pages → Run workflow** (main), or push main again.
3. Wait for successful deploy; open the URL returned by the deployment. Intended path: `https://langzonedev.github.io/DubDizzles/`.

The connected GitHub tool can commit files but does not expose Pages administration. Enabling Pages cannot be completed through that connector. Do not add a PAT to the repository or embed a token to work around it.

## Greg's acceptance pass

Desktop Edge/Chrome: deploy, move/turn, fire, reload, hit rivals, find green supply crate, hold central flag, place/destroy cover, die/redeploy, finish a round and start another. Esc must pause; Resume and menu must work by keyboard. Verify loadout cash deduction and free fallback. Adjust sensitivity and sound.

Phone: landscape, hold movement while aiming and firing; lift each finger independently; test all actions and portrait layout. Browser emulator/cloud testing does not replace this test.

Offline: first open online until cache-ready notice, close/reopen, go offline and reload the same Pages path; complete a round. Reconnect for updates. Install from browser if offered; manifest includes SVG icon, but browser-specific installation needs checking (raster icons may be required by some launchers).

## Operations and privacy

No backend or ongoing game-server fee. No accounts or telemetry. Local cash and best score use `dub-dizzles-profile`; users can clear site data to reset. Multiple concurrent game tabs are not coordinated. No real-money value. No user text or external content enters rendering. Service worker caches only its own scope/assets and deletes only its own versioned caches. Bump its version on app updates. CI runs only on main pushes/manual dispatch with read-only source and scoped Pages publishing permissions.

## Decision and learning record

Core AGENTS blob adopted: `9b041baf974b9b2de460eaeb4384949c15cc6754`. Accountable delivery: root; independent source mechanics/security review: qa_security; independent source UX review: design_review; human game-feel/production acceptance: Greg.

Metaverse Mobile README, docs/MOBILE_CONTRACT.md and docs/IMPLEMENTATION_STATUS.md were consulted where available for reusable lessons. Use per-pointer touch ownership, normalised movement, wall sliding, safe-area layout and bounded time steps. No Unity code/assets were transferred to this public repo. Any future genuine physics/terrain migration should assess a WebGL engine rather than expanding the raycaster into a second Unity runtime.

## Published source / CI result

Main candidate commit: `ecd2a34a90f16e6389bd7700e2a6b6a7c64f7b7c`.

GitHub Actions run `41971307113`: **verify SUCCESS** (17 tests, syntax checks, application-only Pages artifact). **deploy FAILURE** at configure-pages: GitHub reported the Pages site was not found and must be enabled/configured for GitHub Actions. The game is committed but is not yet live. After enabling Pages, rerun the failed deployment job or dispatch the workflow. No further source or credential changes are needed for this setup step.

Core portfolio registration: `bbe7718ae096d2d31d9cee2a88c4b0973ce101dd`. The register preserves the historical inventory snapshot counts and adds this candidate separately.

## War Dizzles rename and live publication

The operator enabled GitHub Actions for Pages and renamed the app to **War Dizzles**. Repository and Pages path remain `DubDizzles`. Display title, wordmark, WD icon, manifest name and weapon marking updated; installed-app identity and existing save/cache namespace preserved. Cache generation is now v3.

Rename commit `6f4b1b29c6bf8390dbd5e63e59550f9119d9aaf7` passed verify and deploy in Actions run `41972355799`. Observed live URL: https://langzonedev.github.io/DubDizzles/ . This supersedes the earlier first-publication blocker.

Remote cloud Chrome evidence: renamed landing page and icon/WD wordmark rendered; cache-ready status displayed; Deploy entered a rendered first-person scene with HUD/minimap; pointer lock was unavailable and its explicit keyboard/drag fallback appeared; Escape paused and Space activated focused Resume. No game-origin errors appeared in captured browser logs (browser-extension metadata errors were unrelated). This is a remote-browser smoke test, not a Windows or physical-phone test. Full offline reload/update, sustained mouse capture, real touch comfort and performance remain pending.

The browser walkthrough exposed allies overlapping the operator at initial spawn, causing oversized close-up sprites. Allies now spawn at least two metres away and very close bot billboards are culled; the spawn clearance is covered by the existing mechanics suite. Space now fires on the initial keydown as well as held input, so short taps register on slow rendering frames. The 17 mechanics tests and syntax checks pass after these corrections.
