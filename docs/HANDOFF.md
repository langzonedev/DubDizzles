# War Dizzles 0.5.0 — laptop and ICT-team handoff

Date: 5 November 2026, Australia/Adelaide. The operator's repeated report of aim locking while walking is the primary acceptance issue. This pass does not pretend that a green mouse-emulation test proves an actual laptop touchpad is fixed. Existing main/public Pages authority remains in force.

Play: https://langzonedev.github.io/DubDizzles/

## First morning check

1. Refresh to v0.5.0 and select Laptop / trackpad. Q toggles aim. C starts cruise without a held W key; tap WASD to toggle directions/diagonals, then release the keys. F toggles the trigger. C stops cruise; X stops movement and firing; Escape pauses. These controls provide a way to aim/move/fire without continuously holding keyboard keys or multiple trackpad buttons.
2. Move the trackpad while holding W/D with Q aiming. Compare that with the same finger movement after releasing those keys, then with C cruise. If pointer movement only stops during held keys, the OS/driver may be suppressing its events.
3. For normal held-WASD play on Windows Precision Touchpads, try Settings → Bluetooth & devices → Touchpad → Taps → Touchpad sensitivity → Most sensitive. Location/support can vary by driver. [Microsoft documents suppression after keyboard input](https://learn.microsoft.com/en-us/windows-hardware/design/component-guidelines/touchpad-tuning-guidelines). The game does not modify Windows or driver settings and cannot restore input never delivered by the driver.
4. Tune Look and ADS speed separately. Mouse / raw input uses unadjusted pointer capture where supported with a normal-capture fallback; laptop mode preserves adjusted trackpad input. Test aim while walking, diagonal strafing and reversing, with continuous look in both axes.

## Delivered slice

- Laptop profile, visible cruise/trigger state, no-held-key movement/trigger alternatives, emergency stop and interruption/death cleanup.
- Separate ADS sensitivity, independent look processing and raw mouse capture fallback.
- Circular collision/full-vector wall sliding, actual-travel walking feedback and immediate ADS stop/reverse with weapon-specific speeds.
- Enemy acquisition/facing lead before firing, hit/readiness feedback and readable character/weapon material details.
- Original ICT/RMA/FRAGILE/server/patch-panel/ticket crate variants with a Dell-text nod. No downloaded brand art or third-party game assets.
- Cached ray geometry, reduced occlusion path work and Auto internal-resolution adaptation after sustained frame pressure, with slow recovery and no input scaling changes.

The original palette, deployment composition, solo match loop, wallet/save identities and per-life economy remain. No accounts, telemetry, purchases, server or multiplayer were added.

## Evidence and publication

Independent source/controller/browser results and remaining hardware conditions are in [LAPTOP_REVIEW.md](LAPTOP_REVIEW.md). Published candidate d82c177 and Actions run 42031505430 passed both browser gates and deployment; root verified all ten served asset hashes and live laptop/Mouse-profile/offline checks. Full evidence is in [RELEASE_0.5.0.md](RELEASE_0.5.0.md). Historical 0.4.0 evidence remains in FEEL_REVIEW.md and RELEASE_0.4.0.md.

Run npm run verify. The browser gauntlet runs regular Chromium, preserves the strict no-camera-warp check and uses bounded simulation-state waits. Physical touchpad palm rejection, phone comfort, heat and enjoyment require actual device/human evidence; synthetic events are not those checks.

## Next human gameplay pass

Play two rounds with the new laptop controls and then with your preferred physical mouse/trackpad setup. Try all three sights, aim/walk/fire and reverse direction, corners/wall sliding, supplies/cover/grenades, damage/death/redeploy, pause/recovery and restart. Judge targeting comfort, readable enemies, gun presentation, ICT humour and whether the loop is fun. Check phone portrait/landscape multi-touch separately. Unattended bot outcomes are completion evidence, not proof of competitive balance.

## Operations

Cache generation: dub-dizzles-v10. A full bundle must cache before activation; other apps' caches are untouched, and an active match is not forcibly reloaded. Refresh to use the new version. Wallet/best remain dub-dizzles-profile, preferences war-dizzles-settings. Denied storage leaves session play; local cash has no real-money or trusted competitive value.

Rollback: revert the application change, increment the worker cache again, rerun verify/browser/deploy, and inspect the live page plus offline reopening. No OS setting, credential or account change is part of this release.
