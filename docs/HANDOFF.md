# Human handoff — Dub Dizzles v0.1.0

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
