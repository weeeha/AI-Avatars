# Luminous faces, core eyes, assistant iris, and fractal presence

These four families preserve the original local procedural studies and add a complete, independently selectable activity and expression vocabulary. All 25 designs appear in the gallery with individual links. They run locally with ordinary browser APIs; no account, host API, CDN, microphone, audio, or agent connection is needed.

## Contract

Every design supports 12 activities and seven expressions, including all 84 combinations:

| Activity | Performance |
| --- | --- |
| Idle | Original material loop with a small ambient drift |
| Starting / waking | Open from a compact pose, overshoot gently, then settle |
| Listening | Draw inward, open the aperture and attend with a slight upward bias |
| Thinking | Alternating fold, tilt, and inward focus |
| Researching / searching | Scan different horizontal and vertical regions |
| Working / coding / checking | Index through four focus points with a repeated contraction |
| Answering / speaking | Expand and release in simulated syllable groups |
| Waiting | Release tension, lower slightly, and hold |
| Needs input / approval | Lean forward once, enlarge the attentive opening, then hold |
| Complete / success | One opening gesture and a resolved pose; only manually selected or part of the explicitly simulated demo |
| Error / recovery | Brief recoil followed by a contracted, interrupted hold; Recover returns to idle |
| Sleeping | Close and lower into a dim, compressed resting pose |

Waiting, input, error, sleep, startup, and completion settle by 2.4 seconds. A new selection blends out of the held pose over 450 ms. Continuous activities keep their original material motion. Character-dependent tempo and amplitude retain distinct temperaments. The renderer changes actual geometry, pupil opening, gaze, or field deformation; changing color alone never represents an activity.

Expressions remain independent: **neutral/calm, happy, curious, surprised, confused, concerned, playful**. Happy lifts and softens; curious cocks and opens; surprise enlarges the opening; confusion alternates tilt and folding; concern narrows and lowers; playfulness adds a springing sway. In waiting/input/error/rest, expressions settle with the activity rather than creating endless attention demands.

## Individual character treatments

| Design | Preserved identity and deformation channels |
| --- | --- |
| Constellation | Seven red almond eyes, dark pupils, restrained bloom; eyelid opening, gaze, cluster lean |
| Halo | Six green filaments; ring ovalization, asymmetric folds, traveling currents |
| Prism | Amber triangular outline; triangle squeeze, edge flex, pointing tilt |
| Knot | Woven green 3D strands; projected yaw, strand depth, knot folding |
| Portal | Nested blue squares; differential layer squeeze, folding and tilt |
| Sun | Golden radiating core; core dilation, corona expansion, rise and compression |
| Pulse | Violet waveform strands; amplitude, envelope squeeze and phrase rhythm |
| Wheatley | Fractured blue/cyan iris; nervous gaze, double blink and iris opening |
| Space | Golden rays; orbiting radial filaments and iris compression |
| Rick | Green checkerboard and slit; grid scan, gaze and vertical opening |
| Fact | Two pink segmented rings; counter-indexing, gaze and iris deformation |
| Morality | Soft violet iris and highlights; soft dilation, gaze and lid movement |
| Curiosity | Orange concentric iris; exploratory gaze and pupil dilation |
| Intelligence | Blue segmented iris; sequential beam and precise focus steps |
| Anger | Red iris and black slit; restrained tremor, slit contraction and lid shape |
| Paranoia | Red iris, yellow center, four satellites; watch-point darts and satellite motion |
| Optimism | Cyan iris with diagonal cuts; buoyant gaze, cut rotation and dilation |
| Nihilism | Magenta petal wheel and heavy lid; slow wheel, lowered opening and gaze |
| Priority | Yellow cross inside a red ring; focus acquisition, gaze and tilt |
| Orbit | Cyan/orange counter-rotating arcs; orbit alignment, gaze and dilation |
| Signal | Notched green ring with yellow pupil; pulse expansion and iris opening |
| Gear | Yellow cog; mechanical indexing, central aperture and gaze |
| Aperture | Eight blue shutter blades; rotating iris and shutter opening |
| Assistant iris | Detailed branching shader fibres and dark pupil; radial flow, pupil dilation, sector folds, two interrupted error gaps |
| Fractal presence | Dense recursive red/blue/white plumes; plume curling, field lean, branching deformation and compression |

Original source files were `superclock-luminous-faces-bold.html`, `superclock-core-eyes.html`, `assistant-ring-states.html`, and `code-fractal-presence.html` from the October 8 local explorations. Their drawing/shader implementations are retained in the editable studies. The controls are now standalone, including formerly host-provided variant navigation. The iris retains all seven color palettes. Core eyes retain optional reference housing and local clock time; the clock has no alarm feature in this family.

## Interaction and accessibility

- Character, activity, emotion, and system condition are explicitly labeled selectors. Each variant has a direct `?character=` link.
- Play/Pause controls motion. Demo traverses a labeled simulated sequence; selecting any activity or system condition interrupts it.
- Acknowledge is a short nod/opening gesture that returns to the current activity/expression. Error, input requests and sleeping suppress this decorative reaction.
- Recover to idle explicitly exits an error or held state. No elapsed timer invents successful completion.
- Offline/reconnecting use a waiting pose; permission-denied and partial results use input-required; paused uses waiting; cancelled uses idle. The full condition label remains visible, so the reused animation does not imply a different outcome.
- Reduced motion starts and stays in a meaningful still pose, responds to live preference changes, and does not allow Demo to restart motion. Turning the preference off leaves playback paused until requested.
- Motion pauses in hidden tabs. User preferences are stored locally when storage is available. No simulated system condition is persisted as a real task status.
- At 320 px, controls stack and the circular stage fits the viewport. Canvas descriptions and live status text describe activity and expression.

## Implementation and verification

Edit `studies/luminous-faces.fragment.html`, `studies/core-eyes.fragment.html`, `studies/assistant-iris.fragment.html`, or `studies/fractal-presence.fragment.html`. Shared acting/control code is `assets/abstract-performance.js`; shared control styling is `assets/abstract-performance.css`. Build generated preview files with `npm run build`.

`tests/abstract-smoke.cjs` renders all 2,100 combinations, checks actual canvas pixel changes for each activity and expression, checks held-state settling, and exercises interruption, reaction return, playback, recovery, semantic conditions, color/clock controls, live reduced motion, persistence, and mobile layout. Screenshots include idle, curious research, and concerned input for every design plus each mobile page. The tests validate browser simulation, not physical display readability or assistant integration.

The iris requires WebGL and reports an accessible error when unavailable. Fractal presence preserves its CPU Canvas fallback. Detailed WebGL and recursive-field rendering can be expensive on low-power devices; physical round-display and device-specific performance acceptance remain separate from these browser checks.
