# Independent mechanics and source review

Date: 5 November 2026. Reviewer: separate QA/CISO execution from the root implementation author. Architecture documentation and security review share this reviewer; that pair is not independently assured.

Scope: local working-tree game simulation, renderer, browser input/storage adapter, service worker, manifest and HTML. Methods: source inspection and Node automated simulation. No intrusive testing, external account inspection, physical-device operation or production-security certification was performed.

## Executed evidence

`npm test` executes 17 independent Node tests in `tests/game.test.mjs`. All 17 passed on 5 November 2026 against game.js SHA-256 `aace3296389c5eddabf1ecca232f2cc16c7a64f8a3cc44610f698d469845a159`.

Coverage includes solid map boundaries and usable spawn positions, sliding collision, wall occlusion, objective contests, loadout affordability and fallback, corrupt profile bounds, ammo/cooldown/reload, kill rewards without duplicate credit, supply cooldown, cover cost, grenade cleanup/destruction, death/respawn, win/freeze/reset, rival victory, long-frame clamping and a deterministic unattended full round. The full-round scenario ends with exactly 12 bots and no live bot embedded in solid geometry. Deterministic tests establish mechanics; they do not establish gameplay balance, entertainment or device performance.

## Security source findings

No high-consequence server, identity or data boundary exists in the inspected first-release architecture: there is no backend, account, secret, privileged endpoint, remote analytics or third-party runtime dependency. Local wallet/results are deliberately client-controlled and must never be promoted as trustworthy competitive records. Profile parsing and persistence have failure handling, and loaded numbers are bounded. Event feed uses `textContent` rather than HTML injection.

The service worker precaches only relative project assets; fetch handling restricts origin and project path, and cache cleanup targets the `dub-dizzles-` prefix. Installation uses `cache.addAll`, with no forced `skipWaiting` or active-match reload. Source inspection supports the intended offline/update control, but it does not replace browser cache-install, offline-reload or prior-version update execution. Cache version must change when executable assets change.

The app uses generated geometry, procedural sounds and authored text/art rather than copied reference-game assets. Legal clearance or trademark registration is not claimed by this review. Do not publish internal discovery exports with the game.

## Findings returned to implementation

| Finding | Impact | Owner / completion check |
| --- | --- | --- |
| Global pointer-up clears firing when any touch finger lifts | Holding FIRE while lifting move/look stops fire unexpectedly | Root: isolate fire pointer ownership; inspect revised handler and exercise simultaneous touch input |
| Human counts twice in objective scoring | Copy can make apparent ties confusing | Root: state double presence in controls/mission or align scoring weight |

The separate UX review also records keyboard-overlay activation, reduced-motion and offline-readiness presentation checks. Read its current status rather than treating this record as closure for those issues.

## Verdict and remaining evidence

PASS for the 17 executed simulation tests only. No high-severity security source finding was identified within the inspected client-only scope. Browser journey acceptance, final source-fix retest, deployed Pages availability, offline installation/update, real Windows/browser and physical-phone comfort remain separate evidence owned by the delivery lead and human handoff. This is not a whole-product runtime PASS or an unqualified security assurance.

## Final source retest

The revised app.js (SHA-256 `73ba22a13f04c4182f5412e322df6857f92da30d73438824baca9e839ba6331e`) was inspected after remediation. FIRE now owns a pointer identifier, its release handler checks that identifier, the global release handler acts only in non-touch mode, and movement/look cancellation has independent handlers. The multi-touch finding is closed at source-review level; simultaneous physical-phone input remains pending. Objective copy now explicitly says the player counts as two contractors, closing the clarity finding at source-review level.

The revised keydown handler returns before preventing Space outside active gameplay, preserving native overlay-button activation. Menu sweep and player muzzle/recoil are gated by the reduced-motion preference. Optional enemy muzzle flashes and combat explosions remain visual combat feedback; reduced-motion is not a promise of a flash-free game. The canvas is explicitly above the body background; the fixed HUD is pointer-transparent with touch regions opted in. Runtime layering and comfort still need browser observation.

The Pages workflow was inspected: contents are read-only by default; only the dependent deploy job receives `pages: write` and `id-token: write`. The published artifact is an explicit allowlist of game assets, excluding internal documents, tests, and source exports. Workflow actions are pinned to major release tags rather than immutable SHAs; this is a remaining supply-chain hardening opportunity, with no additional package dependencies introduced.

`node --check app.js`, `node --check renderer.js`, `node --check sw.js` and all 17 mechanics tests passed after the fixes. Browser execution and Pages activation were unavailable to this reviewer. Delivery lead reports remote browser cannot reach the executor's loopback and Pages administration requires the signed-in owner; record the deployed result or its precise activation blocker in the handoff. Overall status remains **source ready for browser validation**, with mechanics PASS and source findings remediated, rather than whole-product acceptance PASS.
