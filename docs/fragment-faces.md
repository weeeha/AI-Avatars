# Character behavior

## Current characters

| ID | Name | Eyes | Artwork |
| --- | --- | --- | --- |
| `fragment` | Fragment | 2 | Separate photographic eye and lip windows |
| `third-eye` | Third Eye | 3 | Floating eyes in a triangle, with floating lips |

Both characters share the selected status, emotion, and spoken phrase. Blinks are staggered between faces, with an independent blink cycle for the third eye.

Statuses: idle, listening, thinking, searching, speaking, done, reminder, error, offline, and sleeping. Auto cycle demonstrates a sequence of these states.

Emotions: neutral, happy, curious, playful, skeptical, confused, sad, surprised, sleepy, and focused. Match status selects the corresponding emotion automatically.

Reactions: wink, got it (nod), no (head shake), surprise, laugh, and blink. Reactions finish and return to the selected status and emotion.

## Eyes

The rendered eye retains the original photographic sclera, veins, tear line, and lashes. The old iris region is reconstructed from neighboring whites, and a new detailed iris texture is composited into the eyelid aperture. The iris has organic fibers and crypts, a dark pupil with subtle dilation, and separately rendered corneal reflections. Each iris moves in eye space and stays circular through blinks; the aperture clips it. Pointer input controls gaze without moving the skin or rectangular frames. Looking away returns control to automatic gaze. Sleeping closes the lids.

Gaze has three modes. **Together** gives every eye the same target. **Independent** gives every eye its own timed fixation and short saccade, including different vertical positions. **Match state** enables this independence during thinking, searching, playful, and confused behavior, with a milder split for skepticism. Listening and pointer focus reunite the eyes. Explicit Independent mode retains individual offsets around pointer focus.

Character crop origins are in `studies/fragment-faces.fragment.html`. The eye positions, aperture shapes, iris colors, blink geometry, and mouth geometry are tailored to the current artwork in `studies/fragment-faces.fragment.html`; adding a character requires defining those geometry values as well as its crop and UI entry.

## Speech

`assets/fragment-faces/hello.mp3` is the pre-rendered synthetic demo, using the macOS Samantha system voice. `studies/fragment-faces.fragment.html` stores its measured amplitude every 20 ms; animation samples it at the audio playback position. Custom phrases use local browser speech synthesis, when available, with approximate word and syllable timing. The voices are synthetic and are not cloned from the faces.

Demo phrase: “Hello. I am your Super Clock. I can listen, think, and now, talk. What would you like to do next?”

## Integration surface

The current page exposes `window.avatarPreview` for preview integration and browser checks:

```js
avatarPreview.setMode('listening');
avatarPreview.setEmotion('curious');
avatarPreview.setGazeMode('independent'); // 'auto' and 'together' are also available
avatarPreview.react('wink');
avatarPreview.setPaused(false);
avatarPreview.startTalking(true); // Included demo phrase
avatarPreview.stopTalking();
```

`getState()` reports readiness, status, expression, animation time, and voice playback state. `seek(seconds)` and `capture()` support deterministic visual checks. This API controls the two mounted characters together; it is not yet a reusable per-character component API.

## Accessibility and persistence

Controls use native form elements. Canvases have accessible descriptions, and status and voice messages are announced. Reduced-motion preference pauses animation on load and when enabled. The selected status, emotion, and pause state are stored locally in the browser. Typed speech is not saved.
