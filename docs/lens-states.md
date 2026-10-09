# Prismatic lens and ten motion designs

All eleven lens designs now support the shared baseline of **12 activities × 7 independent expressions**. The original WebGL glass grid, refraction, color fields, individual scene geometry, and six palettes are retained. Prismatic lenses retain their circular/square display option and speed control. The ten ideas retain their parallel comparison view and speed control; a selector or keyboard-accessible circle button highlights a design, while activity and expression apply to every design together. Highlighting does not restart playback.

## Activities and expressions

| Activity | Performance |
| --- | --- |
| Idle | Original ambient geometry and material flow |
| Starting / waking | Open from a compact pose, then settle |
| Listening | Draw inward and attend; native features gather or open |
| Thinking | Alternating tilt, folding, and inward focus |
| Researching / searching | Explore different regions with a deliberate gaze/sweep |
| Working / coding / checking | Index through focus points; retain native working patterns |
| Answering / speaking | Phrase-shaped expansion and release; silent simulation |
| Waiting | Release tension and settle into a patient pose |
| Needs input / approval | Lean forward and open attention, then hold |
| Complete / success | One opening gesture into a resolved hold; simulated, never inferred from real task progress |
| Error / recovery | Recoil, interrupt the form, and hold until recovery |
| Sleeping | Compress and dim into a readable resting pose |

Neutral/calm, happy, curious, surprised, confused, concerned, and playful can be combined with every activity. Expressions change opening, lean, squash, gaze, and rhythm independently of the palette. Waiting, input, completion, error, waking and sleeping settle by 2.4 simulation seconds, and switching away blends out of that pose over 450 ms.

Material time is continuous across activity changes; activity age separately controls entry and completion gestures. A new state does not interpolate an old elapsed-time value backwards. Material flow pauses when the selected held state settles, when playback is paused, or when reduced motion is active.

## Per-design motion

| Design | Original identity and added acting channels |
| --- | --- |
| Prismatic lens | Fixed refractive grid with flowing color fields; listening ripples, orbiting thought and the original line-by-line coding pattern remain. New states bend, direct, open, and interrupt the interior field. |
| Liquid core | Three merging fluid fields; listening gathers and work indexes one core between deliberate positions. |
| Twin moons | Passing disk eclipses; listening narrows the orbit, answering expands its vertical reach, expressions lean the eclipse. |
| Ribbon knot | Two interwoven light ribbons; thinking changes weave density, while folds and directional lean shape other states. |
| Hourglass | Pouring, filling and turning silhouette; work steps through fill levels, while rest/input/error can hold the current material phase. The fill is a visual motif, not a task progress indicator. |
| Fireflies | Nine independently wandering lights; listening gathers them, work orders them into a grid, and answering expands their spread. |
| Radar sweep | Rings, crosshairs, sweep and three returning targets; research redirects the sweep while expressions shift and open the field. |
| Helix | Two climbing strands and rungs; listening compacts rung spacing, while folding and tilt express attention and concern. |
| Tide | A flowing liquid horizon; answering enlarges wave crests, while state lean and compression change the body of water. |
| Bloom | Six-lobed opening petals and a central core; expression aperture reshapes the opening. |
| Curious eyes | Two eyes with independent gaze rhythm and blink; aperture, gaze offset, lean and contraction express the new meanings. |

All six palettes remain: Prismatic, Pink, Cyan, Lilac, Amber, Mint. Color is a visual choice, not a substitute for state animation.

## Controls, interruption, and honest outcomes

Play/Pause freezes and resumes the exact current pose. Selecting an activity interrupts the demo and any temporary acknowledgment. Acknowledge returns to the selected activity/expression; input, error and sleeping suppress that decorative reaction. Recover to idle explicitly exits a held condition.

The demo is labeled as a visual simulation and clears stale operational conditions before starting. Offline/reconnecting map to waiting, permission-denied and partial results map to needs-input, paused maps to waiting, and cancelled maps to idle. Their full condition labels remain visible. No timer or animation claims real task completion.

Reduced motion uses still equivalents, responds to live preference changes, and prevents the demo from re-enabling motion. A paused or reduced-motion character switch preserves the settled pose, including sleep. Returning to normal motion preferences leaves playback paused until requested. Character/activity/expression and palette/speed/display preferences are stored locally where available.

The pages require WebGL and show an accessible error when it is unavailable. They have no host API, runtime CDN, account, microphone, audio, or live-agent dependency. Device performance and physical circular-display acceptance remain unverified.

## Source and verification

Edit `studies/prismatic-lenses.fragment.html` and `studies/lens-motion-ideas.fragment.html`, then run `npm run build`. The isolated shared controller and styles are `assets/lens-performance.js` and `assets/lens-performance.css`.

`tests/lens-states-smoke.cjs` covers all 924 activity/expression combinations across the eleven designs, actual per-design canvas pixel changes over time, settling, exact-pose pause, reaction interruption/return, operational fallbacks, palette changes, speed/display controls, saved preferences, live reduced motion, and 320 px layout. Regression checks cover long-running material time, paused sleep across character changes, and clearing cancelled/offline labels when a demo starts. Representative idle, curious work, and concerned input captures are saved for every design; the rest of the repository smoke checks continue to run.
