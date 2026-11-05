# War Dizzles

**Budget warfare. Premium nonsense.** An original solo browser FPS by Lang Systems.

## Status

v0.2.0 playable alpha: refreshed UI, procedural materials and characters, three detailed weapon/hand presentations, aiming, reload/recoil animations, tactical bot movement, sprint stamina, quality settings and richer sound synthesis. Independent automated/source review: 31 passing tests. Physical-device and offline-reload acceptance remain tracked in [the handoff](docs/HANDOFF.md). This is a compact retro FPS interpretation, not a feature-equivalent replacement for a AAA game.

Play: https://langzonedev.github.io/DubDizzles/ (repository/path deliberately retain the original name).

## Play

Deploy with the Yard Dogs against Rent-a-Tank and HR Department bot crews. Hold the central zone with more presence than either rival; your operator counts as two. First crew to 60 points wins. Objective presence and eliminations pay local, fictional cash. Choose a free carbine, $250 SMG or $400 marksman rifle per life. Redeploys automatically fall back to the free carbine when needed.

- WASD move, mouse look, click or Space fire, Shift sprint, right mouse hold or Q toggle aim.
- Arrow keys move/turn; drag the battlefield to look if cursor capture is unavailable.
- R reload, E resupply near a green crate, G grenade, B buy/place $100 cover, Esc pause.
- Touch: independent move stick, right-side look area and action buttons including toggle aim. Landscape recommended; real device acceptance pending.

Supply crates refill health, reserve ammunition and grenades on a cooldown. Grenades break orange cover. Cash/best eliminations persist in browser local storage with an in-memory fallback if storage is blocked. Close other game tabs to install a waiting offline update. Offline use needs a successful first online load on the same browser.

## Develop and verify

No install, build pipeline or runtime dependencies.

```sh
npm start
# open http://localhost:4173
npm test
node --check app.js
node --check renderer.js
node --check sw.js
```

Deploy workflow packages only the application assets, keeping project evidence outside the served site. Enable **Settings → Pages → Source: GitHub Actions** before the first deployment. Then run **Verify and publish Pages** or push main. No tokens need to be stored in source. Revert main to roll back; increment sw.js cache version for any modified application bundle.

## Scope and provenance

Original procedural visuals, map, factions, UI, sound synthesis and code. The broad three-team control-zone/economy inspiration is documented from https://www.wardogs.com/ ; no WARDOGS code, models, artwork, music or branding is included. Independent parody, not endorsed or affiliated. Metaverse Mobile informed touch ownership and stable collision/time-step decisions; Unity source and assets were not copied.

Multiplayer, vehicles, vertical 3D terrain, jumping/crouching, large-scale environments and advanced destruction are future work. No real money, accounts, analytics, tracking or network gameplay. Local wallet is intentionally client-owned and unsuitable for competitive or monetary use.
