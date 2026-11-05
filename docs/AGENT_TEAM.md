# War Dizzles polish gauntlet — 5 November 2026

Outcome: a smooth, readable, resilient solo browser FPS ready for the next human playtest. Target: `langzonedev/DubDizzles`, `main`, authorised public Pages publication. Human product/release authority: Greg, explicit current main instruction plus existing AGENTS publication authority. No binary required; the deployable artifact is the static application bundle.

Core reference: Lang Systems role catalogue and delivery graph; local Core checkout `b586237`, remote baseline inspected at `00da561cb88a8d3bcdb19e468d77034d7222cd8f`. Existing uncommitted Core files were preserved. Named roles are operating instructions applied by these agents, not a claim that external employees were contacted.

| Packet / graph node | Accountable agent and Core role | Owned output | Handoff / gate |
|---|---|---|---|
| Intake, convergence, integration / G0–C2, G8 | root / Core R01, Technical Architect R05 | Scope, app controller, input, audio, performance, team ledger | Independent QA |
| Simulation / G3, G7–G8 | gameplay / Domain R07, Developer R08 | game.js, mechanics tests | root then QA |
| Experience / G4, G8 | presentation / Product Architect R04, Developer R08 | renderer.js, HTML, CSS | root then QA |
| Independent gauntlet / G9, G11 | qa_gauntlet / QA Engineer R12, risk overlay R06 | Controller/worker tests, adversarial review, browser checks | Return defects to author; explicit final verdict |
| Release and knowledge / G10, G12 | root / Release Engineer R11, Knowledge R13 | Version/cache, CI/deployment evidence, handoff | Greg human playtest |

Protected: original public assets only, browser-only/offline, relative /DubDizzles/ paths, existing local wallet/save identity, per-life economy, independent touch ownership, pause/recovery, caches belonging to other apps. Excluded: multiplayer, accounts, telemetry, purchases, remote execution, private source transfer and engine migration. Backend/native/commercial roles are inactive because this increment has none of those surfaces. No extra services/dependencies in the shipped game.

Acceptance: platform-independent passing mechanics/controller/worker tests; JS syntax; browser deploy/move/aim/fire/reload/pause/restart; portrait/landscape layout and emulated multi-pointer checks; offline reload/cache isolation/update; bounded render budget and measured desktop frame timing; no browser runtime errors. Physical phone, thermal and subjective play-feel acceptance remain Greg's next handoff and cannot be replaced by emulation.

Initial audit: Windows controller tests failed because their import-stripper assumed LF; fire cadence depended on frame rate; render dimensions could distort wide/portrait viewports. Cause owners assigned above. QA loops return failures to the appropriate author and rerun affected checks before closure. Final evidence and remaining conditions are recorded in GAUNTLET_REVIEW.md and HANDOFF.md.
