# Core baseline adoption

Adopted on 5 November 2026 from `langzonedev/LangSystems-Core-Development`.

Pinned authority: `AGENTS.md` blob `9b041baf974b9b2de460eaeb4384949c15cc6754`, read via the connected GitHub source. The complete Core commit revision was not available in that response; do not mistake the blob SHA for a commit SHA.

Applicable rules adopted:

- Define the user outcome and measurable acceptance before claiming completion.
- Use the least-complex platform justified by the experience: a static, local-first browser game.
- Keep sensitive information and secrets out of the public source and build.
- Record source inspection, automated logic tests, remote-browser evidence and real-device acceptance separately.
- Include desktop/mobile input, pause/recovery, PWA offline/update behaviour and deployment verification in the acceptance path.
- Preserve reusable decisions, known limits, remaining human checks and rollback steps in the product repository.

Project authority: Greg explicitly authorised main-branch pushes and public GitHub Pages operation for this project. No additional publication permission is inferred or needed for that stated scope. Multiplayer remains later scope.

Roles: root execution owns delivery/implementation/release; a separate UX review execution owns product/interaction review; a separate QA/CISO execution owns architecture documentation and source/logic review. Architecture authorship and its security review are combined within the latter execution, so those two role labels are not an independent architecture assurance claim. Independent source/logic review of root-authored implementation is distinct.

Proportionate deviations: no backend, authentication, database, telemetry or cloud service is introduced for a single-player static game. No claim of universal-browser or physical-device acceptance is made without evidence. The full generic discovery-export document catalogue is reduced to the product brief, architecture, acceptance, review and handoff documents needed to build and evaluate the actual game.

Core references read for this work include `agents/ciso/ROLE.md` (blob `dd628f0b48174f58d516ce845ac693b62324f3a9`), `agents/qa-engineer/ROLE.md` (blob `6077b1800df787db4b34310b62d26c2b9f3996d1`) and `playbooks/SECURITY_REVIEW.md` (blob `a2b48ffa96325d107ee513fdece3091643be1ce5`).

## 0.3.0 team pass

The current operator explicitly requested fan-out, the Lang Systems Core team and main publication. The [team ledger](AGENT_TEAM.md) supersedes the historical role allocation above for this increment. Core's role catalogue, delivery graph, shared operating standard and named Core/Developer/Product Architect/QA/Release Engineer roles guided bounded author packets, convergence, independent verification and cause-owner rework. Remote Core main was inspected at `00da561cb88a8d3bcdb19e468d77034d7222cd8f`; the existing modified local Core checkout was preserved. No private project source/assets were transferred and no external employee/service was contacted. The product's established static solo scope and publication authority remain controlling.
