# War Dizzles 0.3.0 release evidence

Release date: 5 November 2026 (Australia/Adelaide). Operator authority: commit to main and run the multi-agent quality gauntlet; existing project authority explicitly covers public Pages publication.

The release candidate includes gameplay cadence/navigation/collision fixes, tactical and combat feedback, bounded rendering/HUD/audio work, hybrid/touch recovery, accessible pause, reduced-motion support, match accuracy and original PNG install icons. Service-worker cache generation: `dub-dizzles-v8`.

Independent technical verdict and local browser evidence: [GAUNTLET_REVIEW.md](GAUNTLET_REVIEW.md). Human playtest and recovery instructions: [HANDOFF.md](HANDOFF.md).

## Published and verified

- Application release commit: [`646c4003fd9e39064fa1a2aeb393df7bff88852e`](https://github.com/langzonedev/DubDizzles/commit/646c4003fd9e39064fa1a2aeb393df7bff88852e), pushed to `main`.
- [Verify and publish Pages run 41997054280](https://github.com/langzonedev/DubDizzles/actions/runs/41997054280): **SUCCESS**. Verify passed in 39s, deployment in 36s. CI ran all 53 tests, four module syntax checks and the real Chromium browser smoke before packaging. The browser screenshot artifact is attached to that run.
- Live URL: https://langzonedev.github.io/DubDizzles/ . Root verified HTTP 200 and SHA-256 byte equality against the exact release Git blobs for all ten application/manifest/icon assets: index.html, style.css, app.js, game.js, renderer.js, sw.js, manifest.webmanifest, icon.svg, icon-192.png and icon-512.png. The served bundle is the accepted release, not an older cached candidate.
- Post-deployment local headless Edge `156.0.4314.58`, fresh browser context: observed v0.3.0 and worker v8, deployed, fired, aimed, reloaded to 24 rounds, opened Tab pause and returned to menu. Then disabled network, reloaded the same public URL and deployed again. **PASS**, zero page runtime errors. Screenshot: workstation `C:/Users/langa/AppData/Local/Temp/dub-dizzles-qa-tools/final-evidence/live-game.png`.
- Both original PNG icons have verified signatures and dimensions 192x192 / 512x512. Documentation links resolved. The isolated local Edge and independent Chrome gauntlets additionally covered three touch viewports and simultaneous three-finger ownership; see the independent QA record.

An initial live check while Pages deployment was still running correctly observed the previous version. The successful observations above occurred after deployment completed. The final evidence-only documentation commit uses `[skip ci]` because application bytes are unchanged; the release remains bound to the immutable application commit above.

## Exact terminal state

Authorised application release is committed, CI-verified, deployed and live-smoke-verified. No blocking source defect remains from the agent gauntlet. The next owner is Greg for physical-device comfort and subjective gameplay acceptance; those checks remain explicitly unclaimed. Rollback and the human test route are in HANDOFF.md.
