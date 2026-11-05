# Architecture and security boundary

Status: first browser release. The Operator authorised implementation, main-branch publication and public GitHub Pages hosting on 5 November 2026. This supersedes the attached discovery export's generic instruction to await approval.

## Decision: static, local-first FPS

The confirmed platform is a browser link, primarily Windows desktop with mobile support and occasional offline use. Multiplayer is explicitly later work. A self-contained HTML/CSS/JavaScript application served by GitHub Pages is the smallest architecture that delivers that outcome without hosting costs, accounts or a persistent backend. Game code is intentionally public; there is no confidential strategy or customer dataset.

The product is an original stylised parody. Shipped geometry, sounds, marks and wording must be original project assets or assets with recorded redistribution rights. The reference title does not supply an asset licence.

```mermaid
flowchart TD
  P["Player: keyboard, mouse or touch"] --> U["Browser UI and input"]
  U --> G["Local simulation and renderer"]
  G --> U
  U --> L["Browser-local preferences and best results"]
  H["GitHub Pages static origin"] --> U
  H --> S["Scoped offline asset cache"]
  S --> U
```

All simulation is client-authoritative and suitable for solo play with bots. A future competitive multiplayer release needs a separate threat model and authoritative server; local results are not trustworthy competitive records.

## Data model and retention

Runtime state comprises player position, health, loadout/ammunition, bots, objective state and match results. Runtime state is disposable. Only the preferences and local best results actually implemented may persist in browser storage. No identity, account, location, contact information or telemetry is required. Storage denial must leave a usable session; clearing the site's browser data resets local persistence and offline availability. There is no migration/import requirement or remote database to back up.

## Interfaces and failure behaviour

The browser loads same-origin relative assets so project-subpath GitHub Pages deployment works. Input flows to simulation and renderer in the same process; there is no external game API. Audio starts only after a player gesture. Pointer-lock refusal must not trap the player; pause/resume and touch controls must remain understandable. Tab hiding, focus loss and pause must stop simulation/input progression and prevent stuck firing or movement. A cached app can operate after a successful online load; first-ever offline access cannot be promised.

## Security and privacy controls

- No secrets, credentials, privileged endpoints, remote analytics or user-generated HTML are needed.
- Keep service-worker control and cache matching inside the project scope; cleanup must target this app's own cache names, never other sites/projects sharing the origin.
- Prefer a complete versioned asset cache; a failed installation must retain the previous working version.
- Serve active assets from the same origin. Avoid runtime CDN dependencies so the offline claim is meaningful and third parties receive no gameplay requests.
- Restrict CI permissions to the release job's actual needs. Changes to Pages workflows require review because workflows can receive repository permissions.
- Public exposure permits source copying and local score manipulation; neither creates server access because none exists. Do not present a local leaderboard as tamper-resistant.

This document defines controls, not an unqualified security certification. QA must bind source inspection and execution evidence to the actual candidate. Public-host availability, browser vulnerabilities, account/organisation settings and physical phone performance are outside source-only verification.

## Deployment and recovery

Publish repository-owned static assets to GitHub Pages using relative URLs. Keep source changes on main under the user's explicit authorisation. Record the release revision and verify the public URL after deployment. Roll back source through a normal revert and redeploy; bump the offline cache version when shipping changed executable assets. Old browser tabs may continue their loaded version until reload. Never silently describe a committed build as live until the public deployment is observed.

## Deliberate limits

This release is a solo arena FPS with bots, not a feature-equivalent recreation of an AAA game. It does not promise online multiplayer, thousands of concurrent players, cross-device saves, accounts or guaranteed support for every browser/graphics stack. Native phone and real Windows playtesting remain required human acceptance evidence where the execution environment cannot provide it.


## 0.2.0 visual/gameplay pass

Retains dependency-free Canvas raycasting. Detailed models are original procedural 2D perspective drawings and cached directional sprites, not imported 3D meshes. Materials are generated once and retained; soldier cache is bounded. Graphics setting selects internal rendering resolution and floor sampling; portrait internal height is capped at 1280. Aim changes accuracy/FOV and aligns the illustrated sight. This remains a retro FPS: no vertical aim hit simulation, stacked floors or 3D physics. Evaluate a proper WebGL engine for that future scope. Cached BFS navigation invalidates only when cover changes. Controller settings are optional local storage with malformed-value recovery.
