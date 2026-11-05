# Acceptance scenarios

These are proposed observable checks for the first solo release, derived from `PRODUCT_BRIEF.md`. Record implementation evidence separately; a checklist is not a test result. Browser, physical-device and participant evidence must remain distinct.

| ID | Journey / requirement | Pass condition | Verification |
| --- | --- | --- | --- |
| AC01 | Public link | Published Pages URL returns the game; assets load under `/DubDizzles/`; no account is required | Deployed HTTP check and browser load |
| AC02 | First use | Title, objective, controls and a clearly labelled start action are available before gameplay | Desktop and narrow viewport inspection |
| AC03 | FPS movement | Forward/back/strafe and look change the first-person view; collision prevents passing through solid world geometry | Interactive browser gameplay |
| AC04 | Combat | Firing consumes ammunition and visibly responds; enemies can take damage; a reload completes with the advertised ammunition state | Interactive gameplay plus focused simulation checks |
| AC05 | Enemy threat | Bots move/attack, player damage is visible, and defeat reaches a recoverable result screen | Gameplay or deterministic simulation |
| AC06 | Complete loop | Objective/progress is visible; success or defeat ends a match; restart resets the match rather than carrying stale entities, health, input or timers | Win/lose/restart scenario |
| AC07 | Interruption | Pause, pointer unlock or hidden tab prevents uncontrolled gameplay; resume does not advance the simulation by the whole interruption or retain held inputs | Pause/tab-switch scenario |
| AC08 | Input recovery | Pointer-lock rejection never strands the player; touch look/move and on-screen fire/reload allow a match to be played without mouse or keyboard | Rejected-lock path and touch-capable browser; physical phone still required for comfort |
| AC09 | Responsive game | At 390×844 and 844×390, primary controls and objective/health/ammo remain visible, overlays can scroll, and touch targets do not overlap | Remote browser viewport inspection; separately record actual phone evidence |
| AC10 | Offline | After a completed online visit and active service worker, reload with network unavailable still loads all essential assets and starts a solo match | Browser offline network test |
| AC11 | Update safety | Cache scope is limited to this app, a failed cache install retains the previous working version, and an update does not forcibly reload an active match | Service worker review plus update scenario |
| AC12 | Local state | Unavailable/corrupt local storage does not prevent play; stored values are bounded; reset/new match works | Browser storage failure or source/simulation check |
| AC13 | Sound / comfort | Sound follows user interaction and can be muted; sound is not the only feedback; reduced-motion setting/preference removes optional shake/bob/flashing effects | Keyboard/menu and reduced-motion scenario |
| AC14 | Menu access | Native labelled controls, visible keyboard focus and readable text support starting, pausing, changing settings and restarting | Keyboard walkthrough |
| AC15 | Performance | A representative match remains responsive and does not accumulate entities/listeners on restart; tested browser/device and observed limits are recorded | Match play and repeated restart check; no invented FPS claim |
| AC16 | Public-source boundary | No secrets or internal discovery documents ship; all game assets are original or have recorded licences; no claim of official affiliation | Repository and network request review |

## Human handoff test

On Windows Edge/Chrome, play two complete rounds, change sound/comfort settings, pause/resume, and restart. On a physical phone, open the same published URL, try portrait and landscape, move/look/fire together, reload, interrupt the browser, and return. After one completed online load, repeat with connectivity disabled. Report comfort, readable HUD, apparent frame rate, objective clarity, and any browser errors. Device-specific verification remains open until observed; remote viewport checks cannot close it.

Human acceptance should decide whether the loop is fun and the parody tone works. Automated checks can establish mechanics, not enjoyment.
