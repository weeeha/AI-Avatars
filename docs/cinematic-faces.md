# Character behavior

## Characters

| ID | Name | Visual language |
| --- | --- | --- |
| `eidolon` | Dot flock | Round sculpture of individually shaded blue dots; dimensional eyes; particles flow, separate, scatter, and reform |
| `lens` | Red eye | Red glass lens; cool reflections; expressive luminous aperture |

The two renderers share the same activity, emotion, and transient reaction state. They express that state differently: Dot flock deforms facial features and particle flow; Red eye changes its core aperture, gaze, light, and surrounding motion.

## Activities

| State | Behavior |
| --- | --- |
| `idle` | Gentle ongoing motion |
| `waking` | Awakening pulse and lifted expression |
| `listening` | More focused and cohesive motion |
| `thinking` | Circulating particles or an orbiting lens highlight |
| `speaking` | Simulated syllable rhythm drives mouth or light |
| `searching` | Scanning gaze and traveling particle release |
| `remembering` | Upward gaze and reflective expression |
| `success` | Brief smile and celebratory particles, then settle |
| `error` | Brief head shake, then a concerned recoverable hold |
| `sleeping` | Lower energy, closed eyes, and dimmed lens |

## Emotions

`calm`, `happy`, `curious`, `focused`, `surprised`, `worried`, `sad`, `annoyed`, `playful`, `sleepy`, `confused`.

Emotion blends into the active behavior. Focused and annoyed expressions preserve eye volume; blinking, winking, and sleeping can intentionally close the lids. Iris particles are occluded by eyelids instead of being flattened into a line.

## Short reactions

| Reaction | Duration |
| --- | --- |
| Nod yes | 1.9 seconds |
| Shake no | 1.9 seconds |
| Wink | 1.6 seconds |
| Laugh | 3 seconds |
| Startled | 2.4 seconds |
| Celebrate | 3.6 seconds |

Reactions finish automatically and return to the selected emotion. The conversation sequence runs through waking, listening, thinking, searching, speaking, success, and idle in about 17 seconds. It simulates interaction without audio.

## Continuing the design

Keep individual dots visible and the head round. Skin samples have a minimum gap, and each dot is shaded as a small bead with restrained glow. Upper-left lighting reveals the forehead, nose, cheek, and chin volumes. Staggered eyelid beads preserve rounded eyes without dense continuous rings. Preserve curved eyelids, rounded irises, dark pupils, and highlights when refining expressions. Treat activities, emotions, and temporary reactions as separate inputs. Always review a moving preview, focused and annoyed eyes, paused state changes, character switching, and a narrow mobile viewport after geometry or animation changes.

## Source and preview

Edit `studies/cinematic-faces.fragment.html`, then run `npm run build` and `npm run check`. Open `characters/cinematic-faces/index.html` after starting the gallery with `npm start`. The character links support `?character=eidolon` and `?character=lens`.

Both characters use Canvas 2D with projected 3D particle positions and CPU flocking. Speech and AI activity are simulated. These are browser-rendered animations, not prerecorded clips. Browser preferences are stored locally and no network service is used.

## Completed lifecycle

Working uses short downward fixations, coding reads across short lines, and checking alternates between two comparison targets and center. Waiting becomes quiet; needs-input and awaiting-approval give one upward invitation before holding attention. Waking opens the eyes over 1.5 seconds. Success settles after 2.8 seconds; error shakes once instead of repeating indefinitely.

Offline, reconnecting, permission-denied, paused, cancelled, and partial have explicit captions. These conditions are manually previewed, never inferred from a decorative loop. Concerned is an alias for worried, and neutral for calm. The activity aliases starting/waking, researching/searching, answering/speaking, and complete/success support the shared vocabulary.

`window.cinematicPreview` exposes `setMode`, `setEmotion`, `setPaused`, `react`, `seek`, `getState`, and `capture`. Stopping the conversation demo preserves the prior activity age, so settled outcomes stay settled. Selecting a new activity interrupts a reaction; finishing a reaction returns to the selected activity. Reduced-motion changes pause ongoing animation, with explicit Play available.

`tests/cinematic-state-smoke.cjs` verifies both renderers' full lifecycle, changing frames, emotion overlays, interruption/return, settled completion, condition captions, live reduced motion, and mobile layout.
