# UX design contract and review record

## Ownership and evidence

UX design contribution: `design_review` agent, separate from application implementation. Scope: first solo browser FPS. Reviewed inputs: the attached discovery facts, Core UX Designer role, UX Design playbook and UX Review playbook on 5 November 2026. This is initially a design contract; it must not be presented as browser QA or observed participant research.

## Experience direction

The game surface earns the screen. Use a distinctive original military-parody palette and typography with Lang Systems attribution in menus, rather than permanent corporate application chrome. In play, prioritise reticle, objective, health and ammo; keep help/settings in pause. Text must remain readable against changing scenery, with backed HUD panels where needed.

The first screen explains the mission and controls in a few lines, offers one dominant start/deploy action, and reserves advanced settings for secondary controls. No sign-in, install gate or long introductory sequence.

| Component | State contract |
| --- | --- |
| Start / deploy | Ready when local game assets and renderer are available; show an actionable explanation if unavailable. Prevent duplicate starts. Enter play only after activation. |
| Pointer capture | Requested after deliberate input. Unlock enters pause. Rejection offers a visible drag/keyboard alternative, rather than repeatedly demanding permission. |
| Fire | Immediate press response, crosshair/hit feedback, ammunition update. Empty magazine gives an understandable reload cue. No screen-wide rapid flashes. |
| Reload | Distinct progress/state; prevent duplicate reloads and explain firing interruption. End with actual ammo state, not a timer-only success claim. |
| Objective | Persistent short instruction and numerical/visual progress; completion gives text and result state, not colour alone. |
| Damage | Health update and restrained directional/edge feedback; avoid extended obstructive overlays. Reduced-motion mode keeps the information with static feedback. |
| Pause | Stops simulation and releases controls. Primary Resume plus secondary Restart/settings; return focus predictably. Hidden tabs clear active movement/fire. |
| Result | Explain success/defeat, show truthful local round stats, offer an obvious new match action. Do not call local results verified global rankings. |
| Offline | A cached game remains playable solo. If offline preparation fails, explain that another successful online visit is needed. |

## Input and responsive contract

Desktop: familiar WASD/arrow movement and mouse look, mouse/keyboard fire and reload, Escape pause. Show actual implemented key bindings; do not advertise absent actions. Keep menu controls keyboard accessible with focus-visible styling.

Touch: left movement zone and right look zone, explicit large fire/reload controls, and an accessible pause control. Use independent pointer identifiers so moving, looking and firing can coexist. Handle `pointercancel` and lost capture. Touch buttons should be at least 44 CSS pixels where possible and clear of browser safe areas. Avoid requiring desktop pointer lock or hover on touch devices.

Menus should fit or scroll in short landscape viewports. Avoid burying the start action below nonessential copy. Portrait may recommend landscape while keeping controls operable. A recommendation must not block play.

## Motion and comfort

Use recoil, bob and hit feedback only to communicate game events. An optional low-motion mode should remove shake/bob, reduce muzzle flash and keep readable static damage/hit cues. Respect the initial OS reduced-motion preference. Sound must be optional and visual feedback must carry the same essential information. No autoplay sound before user interaction.

Essential actions must never depend on an animation-end callback. Simulation deltas should be bounded after interruption. Canvas play itself remains visually demanding: do not claim full screen-reader playability or WCAG certification.

## Review status

### Source design-to-build inspection — 5 November 2026

Inspected `index.html`, `style.css`, `app.js`, `renderer.js` and `game.js` in the first implemented working tree. This was source evidence, not a browser walkthrough. The implemented loop includes three bot crews, zone scoring, three loadouts, cash, supply, buildable cover, grenades, respawns, pause, result and replay. Primary objective, labelled controls and local-wallet wording align with the brief.

Corrections returned to the developer:

| Priority | Source finding | Required correction / verification |
| --- | --- | --- |
| High | Global `pointerup` clears firing even when a different touch pointer is released | Track the fire pointer independently. Hold fire, move/look with other fingers, and release each independently. |
| High | `keydown` prevents Space in pause/result before checking the playing state | Restrict gameplay key prevention to playing so native focused buttons retain keyboard activation. |
| Medium | Reduced-motion source removes bob but retains recoil/muzzle flash and automatic menu camera sweep | Remove optional sweep/recoil/flash or substitute static event feedback; inspect both preference modes. |
| Medium | Static “OFFLINE READY” badge appears before cache installation | Describe capability with the first-online-load condition, or set readiness only after cache success. Handle service-worker unavailability explicitly. |
| Medium | An unavailable paid loadout explains itself only through a disabled-button title | Keep a visible nearby explanation that the free carbine is available and cash is earned in play. |

### Final source recheck

Re-inspected the developer's corrected source on 5 November 2026. Both high-priority input findings are corrected in source: touch fire has its own pointer ownership, and key interception returns immediately outside active play. The CSS now explicitly places the canvas below HUD/menu layers and allows pointer input through noninteractive HUD areas while retaining touch controls. These changes still require runtime input verification.

The menu says “OFFLINE CAPABLE”; successful worker installation separately announces readiness, so the initial badge no longer claims a completed cache. Low wallet advice visibly explains the free carbine. The initial reduced-motion preference now suppresses player shot flash/recoil, bob and menu sweep. Bot flashes, grenade effects and reload motion remain; no full motion-accessibility or WCAG conformance claim is made.

One source follow-up was returned: reset an unaffordable selected paid kit to the carbine. The implementation owner subsequently added this reset in career(), including selected styling and aria-pressed; this final small fix has a syntax check but no further independent/runtime recheck. Source review alone does not establish touch ergonomics, contrast against all scenery, smooth gameplay, pointer-lock behaviour or offline operation.

The owning agent reports that its remote browser could not reach the local preview. Therefore this review closes only source findings, not browser UX acceptance. Public runtime testing also depends on GitHub Pages being enabled. Keep the delivered status **source ready for validation** until those checks are observed.

| Evidence | Status |
| --- | --- |
| Source requirements and interaction contract | Reviewed as design guidance |
| Implemented source / state contract | Rechecked; original high-priority findings corrected in source; final loadout correction recorded above |
| Implemented desktop flow | Not tested: remote browser could not reach local preview |
| Narrow portrait/landscape flow | Not tested in browser |
| Pointer-lock denial / pause recovery | Source paths reviewed; runtime not tested |
| Offline reload and update | Source status wording reviewed; browser behaviour not tested |
| Physical phone comfort and performance | Not tested |
| Player enjoyment / balance | Not tested; operator and friends |

High-priority corrections at implementation review are broken input recovery, hidden objective/controls, unreadable HUD, unavoidable motion/sound, and a match that cannot end/restart. Optional visual polish follows a working end-to-end loop.
