# 0.5.1 — portrait weapon proportions

6 November 2026, Australia/Adelaide.

The operator supplied physical-phone screenshots showing abnormally long sleeves while aiming. Source inspection found a width-fitted weapon combined with sleeves extended to the viewport bottom. On tall screens only the sleeves became much longer. The foreground weapon and ADS sight now share a fixed vertical viewmodel field of view, scaling every part uniformly. Narrow screens crop the model at the side edges; the optic remains centred and optical magnification is unchanged.

Source evidence: a geometry regression checks three weapons at five aim-transition positions across five portrait/landscape dimensions, including the supplied screenshot ratio. Local sleeve geometry is invariant across aspect ratios and fully aimed sight anchors remain centred. All 93 tests and the four application JavaScript syntax checks passed.

Runtime evidence: automated Edge 156.0.4314.58 passed desktop captured aiming/movement/fire, portrait/landscape/narrow touch layout, simultaneous three-finger input and offline reload. The expanded browser gate captures portrait carbine/SMG aiming and SMG reload, plus the existing portrait sniper scope. Root inspected portrait aiming/reload and desktop/landscape images. A separate reviewer inspected the implementation and portrait screenshot with no material blocker. These are browser-emulation checks, not a new physical-phone test.

Deployment: commit `5ab77f281798725d8fb9d1329e0f75faba9cbec6` passed both browser gates and published successfully in [Actions run 42068660753](https://github.com/langzonedev/DubDizzles/actions/runs/42068660753). All ten live application asset SHA-256 hashes matched that commit. A fresh automated Edge mobile context verified live v0.5.1 portrait SMG aiming, pause/menu recovery, cache generation `dub-dizzles-v11` and offline reload/deploy without page errors. Local laptop-profile verification also passed. This is deployment/browser evidence, not physical-device acceptance.

Human check: refresh to v0.5.1 on the original phone, aim with each weapon, reload and rotate between portrait and landscape. Confirm the forearms remain proportionate, the sight stays centred and the controls remain comfortable. Supplied photographs are diagnosis evidence only; they do not show this revised build.
