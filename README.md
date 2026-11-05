# War Dizzles

**Budget warfare. Premium nonsense.** An original solo browser FPS by Lang Systems.

## Status

v0.5.0 laptop/ICT-team iteration: a dedicated laptop profile with no-held-key cruise/trigger controls, independent ADS sensitivity, freer weapon-specific ADS movement, rounded corner sliding, clearer enemy acquisition/hit feedback, original ICT crate art and adaptive Auto graphics. Browser input checks now include continuous look while moving, not just ammunition and position. [Laptop review](docs/LAPTOP_REVIEW.md) and [handoff](docs/HANDOFF.md) separate software evidence from real laptop/phone acceptance.

Windows touchpad drivers may suppress pointer movement while keys are held. A website cannot recover events the driver never delivers. The new laptop controls avoid continuous held keys; for ordinary WASD+touchpad input, try **Windows Settings → Bluetooth & devices → Touchpad → Taps → Touchpad sensitivity → Most sensitive** where available. [Microsoft documents this typing-suppression behaviour](https://learn.microsoft.com/en-us/windows-hardware/design/component-guidelines/touchpad-tuning-guidelines). Your actual trackpad still needs a physical-device check.

Play: https://langzonedev.github.io/DubDizzles/ (repository/path deliberately retain the original name).

## Play

Deploy with the Yard Dogs against Rent-a-Tank and HR Department bot crews. Hold the central zone with more presence than either rival; your operator counts as two. First crew to 60 points wins. Objective presence and eliminations pay local, fictional cash. Choose a free carbine, $250 SMG or $400 marksman rifle per life. Redeploys automatically fall back to the free carbine when needed.

- WASD move, mouse/trackpad look, click or Space fire (works while aiming and strafing), Shift sprint, right mouse hold or Q toggle aim; the sniper uses a 4x optic. Vertical look now directs shots.
- Arrow keys move/turn; drag the battlefield to look if cursor capture is unavailable.
- Laptop profile: Q toggles aim; C starts cruise, then tap WASD to toggle directions and release the keys. C stops cruise; F toggles the trigger; X stops cruise and firing. Pause, focus loss and death clear these latches.
- R reload, E resupply near a green crate, G grenade, B buy/place $100 cover, Esc or Tab pause.
- Touch: independent move stick, right-side look area and action buttons including toggle aim. Push the stick fully forward to sprint. Landscape recommended; real device acceptance pending.

Supply crates refill health, reserve ammunition and grenades on a cooldown. Grenades break orange cover. Cash/best eliminations persist in browser local storage with an in-memory fallback if storage is blocked. Refresh after an update-ready notice to load the latest bundle; an update never forcibly reloads a match. Offline use needs a successful first online load on the same browser.

## Develop and verify

No install, build pipeline or runtime dependencies.

```sh
npm start
# open http://localhost:4173
npm run verify
```

The real-browser gates are `node tests/browser-smoke.cjs` and `node tests/laptop-smoke.cjs` (focused continuous-look/laptop controls). Install Playwright 1.64.1 in a temporary tools directory and set `PLAYWRIGHT_MODULE` to its `node_modules/playwright` directory; set `BROWSER_EXECUTABLE` to an installed Chrome/Edge executable, or install Playwright Chromium. `BROWSER_EVIDENCE_DIR` selects screenshot output. CI runs both gates before publishing and retains the browser evidence as a workflow artifact. The game ships no runtime dependencies.

Deploy workflow packages only the application assets, keeping project evidence outside the served site. Enable **Settings → Pages → Source: GitHub Actions** before the first deployment. Then run **Verify and publish Pages** or push main. No tokens need to be stored in source. Revert main to roll back; increment sw.js cache version for any modified application bundle.

## Scope and provenance

Original procedural visuals, map, factions, UI, sound synthesis and code. The broad three-team control-zone/economy inspiration is documented from https://www.wardogs.com/ ; no WARDOGS code, models, artwork, music or branding is included. Independent parody, not endorsed or affiliated. Metaverse Mobile informed touch ownership and stable collision/time-step decisions; Unity source and assets were not copied.

Multiplayer, vehicles, vertical 3D terrain, jumping/crouching, large-scale environments and advanced destruction are future work. No real money, accounts, analytics, tracking or network gameplay. Local wallet is intentionally client-owned and unsuitable for competitive or monetary use.
