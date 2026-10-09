# Shape companions: emotion and activity states

Eight characters each have a **playable four-second idle animation** and share six expressions and ten activity poses: **128 static pose concepts**. The state sheets are not registered sprite atlases or rigged 3D models. Only idle has an animation export.

## Review

Open [the character viewer](../characters/shape-cast/index.html). Choose a character to play its idle loop. Switch to State concepts to browse poses or open the complete sheet. The canonical machine-readable definition is [shape-cast.states.json](../studies/shape-cast.states.json).

## Character identity

All bodies retain one main hue, white gloves and black boots. Emotion never recolors a character. The following performance directions guide each idle loop and the planned state animations.

| Character | Main color | Acting direction |
| --- | --- | --- |
| Triangle | electric lemon yellow | Jaunty and enterprising. Snappy asymmetrical brows, small forward leans and brisk compact gestures; never angry or bossy. |
| Circle | vivid tangerine orange | Warm and buoyant. Rounded gestures, gentle bounces and open facial expressions. |
| Square | electric spring green | Calm and dependable. Small measured gestures, balanced stance and restrained expressive changes; visibly awake when active. |
| Star | electric hot pink | Playful and enthusiastic. Broad but controlled arm poses and energetic eye expression, without changing the five-point silhouette. |
| Crescent | luminous lavender violet | Gentle and unhurried. Graceful lean, slow nod and relaxed hands. Open attentive eyes for listening and work; fully closed eyes for blinks and sleeping. |
| Bean | electric cyan aqua | Inquisitive and slightly quirky. Small alternating tilts, asymmetrical brows and thoughtful glove-to-cheek gestures. |
| Heart | bright warm coral red | Kind and encouraging. Open palms, soft direct gaze and small reassuring nods; concern is supportive, not distressed. |
| Diamond | electric cobalt blue | Poised and precise. Compact deliberate gestures, mild confident smile and controlled tilts. |

## Core emotional expressions

These are expressive styling cues, not claims that the assistant feels an emotion or has diagnosed the user's mood.

| Expression | Use | Motion direction | Timing |
| --- | --- | --- | --- |
| Happy | A positive conversational moment; never used alone as proof that work completed. | Brief eye-crinkle and small bounce, then return to the current activity. | 2–3 seconds; one shot. |
| Curious | A new topic or user-invited exploration. | Raise one brow, tilt and glance toward the topic, then settle. | 2–3 seconds; one shot. |
| Surprised | An unexpected but noncritical event. | Quick widened eyes and tiny recoil, then recover. | 0.8–1.5 seconds; one shot. |
| Confused | The assistant cannot interpret a request with enough confidence. | Small uneven brow and tilt, followed by a clear clarification question. | 1–2 seconds; one shot. |
| Concerned | A supportive conversational response or a recoverable problem. | Soft gaze, gentle open palm, one small reassuring nod. | 2–3 seconds; one shot. |
| Playful | User chooses a playful tone or initiates play. | One wink and a tiny jaunty wave. | 1.5–2.5 seconds; one shot. |

## Assistant activities

| Activity | Show when | Motion direction | Controls and exit |
| --- | --- | --- | --- |
| Idle | The assistant is available and no task is executing. | Small breathing motion and occasional complete blink. | Accept text input; enter listening only when audio capture actually begins. |
| Listening | Microphone permission is granted and audio capture is actively receiving user input. | Attentive forward lean and a restrained acknowledgment nod. | Stop listening ends capture; show a persistent mic indicator outside the artwork. |
| Thinking | The assistant is processing/planning and is not currently running a tool. | Look up briefly, glove at chin, return gaze to center. | Switch to researching, working, answering or needs-input according to real events; Stop remains available. |
| Researching | Retrieval, browsing or source inspection is actively running. | Small reading sweeps with pauses, then a downward reset. | Show the current source/task label; waiting on a remote service uses waiting, not fake reading. |
| Working | An action such as writing, coding, generating or testing is executing. | Steady downward focus, small precise glove movements, occasional checking pause. | Show the actual action, progress only when measurable, and Stop/Pause if supported. |
| Answering | A response is being delivered as text or audio. | Open-palm explaining gesture with soft eye contact. | Mouth motion follows actual audio if speaking; text-only responses use a quiet mouth; interruption returns to listening or idle. |
| Needs Input | Execution is blocked on a user answer or explicit approval. | Patient questioning glance and one open-palm invitation, then rest. | Ask one clear question; show Answer or Approve/Decline as appropriate; never auto-approve. |
| Complete | All requested work is confirmed successful. | One thumbs-up, small pleased lift, then settle. | Keep a durable result link/message after the pose ends; partial results do not trigger full success. |
| Error | A task or tool action failed and cannot continue without recovery. | One concerned pause signal, then attentive neutral stance. | Show what failed and Retry, Edit request or Dismiss; preserve any completed output. |
| Sleeping | The assistant is explicitly resting and no foreground or background task requires a visible status. | Slow eye closure and a gentle lowered posture. | Wake on explicit user interaction; do not imply ongoing work is finished or hide active microphone capture. |

## System conditions and copy

These are distinct real states that reuse an existing pose, with an explicit label and controls. They do not need additional emotion drawings to ship an understandable UI.

| State | Reused pose | Label | Trigger | Controls and exit |
| --- | --- | --- | --- | --- |
| starting | idle | Starting… | Initialization is running. | Cancel if startup can be interrupted. Idle when ready; error if startup fails. |
| waiting | idle | Waiting for a result… | An external tool or queue has not returned; no active local work. | Stop; show elapsed time when useful, not invented completion percentages. Resume the task when the result arrives; error on timeout. |
| coding | working | Writing code… | Code generation or editing is actually running. | Stop. Checking or answering according to actual workflow. |
| checking | working | Checking… | A real verification step is running. | Stop where supported. Complete only on successful verification, otherwise error or partial result. |
| awaiting-approval | needs-input | Approval needed | A permission-sensitive action awaits explicit consent. | Approve / Decline, with the exact action and destination visible. Resume only on approval; decline leaves the action unperformed. |
| paused | idle | Paused | A user pause has actually been acknowledged. | Resume / Cancel. Resume the saved activity; indicate pending pause until it takes effect. |
| cancelled | idle | Stopped | Cancellation acknowledged. | Start again; keep completed output available. Idle, never complete. |
| offline | idle | Offline | Required connectivity is unavailable. | Reconnect / Retry; identify any available local-only actions. Restore prior task only if it can safely resume; otherwise ask. |
| permission-denied | needs-input | Access needed | A required permission was denied. | Review permission / Choose another method / Cancel. Continue only with a permitted method. |
| partial | concerned | Partly done | Some requested work completed but some remains blocked or failed. | View results / Retry remaining / Stop. Complete only when the remaining work succeeds. |

## Interaction rules

The runtime should store activity and expression separately: `activity`, optional `expression`, `blockedReason`, `micActive`, `audioPlaying`, and `taskId`. These fields are a proposed contract, not an implemented assistant.

1. Set activity from real events. A user request may move idle → thinking → researching or working → answering → complete → idle. Skip phases that did not happen.
2. A brief emotional reaction temporarily changes the pose, then returns to the **current** activity. A new error, permission request, input request, pause or offline event interrupts the reaction immediately.
3. Needs-input holds patiently until a response; awaiting-approval uses the same pose but exposes explicit Approve/Decline controls. No timeout is consent.
4. An acknowledged cancellation becomes Stopped/idle, not success. Preserve already produced artifacts. During pending cancellation, say “Stopping…” until the tool acknowledges it.
5. Work takes precedence over rest. Sleeping is available only when no active task or capture needs to be surfaced. An idle timeout must not hide work.
6. State changes should respond promptly. Avoid flicker by skipping a progress pose for operations that complete in under roughly 200 ms; never delay an actionable error or approval request.
7. Keep completion visible in a durable text result even after the one-shot celebratory pose returns to idle. Partial completion names the completed and blocked parts.
8. A waveform or mic badge must reflect actual capture, and an audio indicator must reflect actual playback. This viewer simulates neither.

## Motion and transition notes

- Default pose blend target: 180–280 ms, soft easing. These are design targets to tune in animation.
- Expressions: 0.8–3 seconds, generally once per relevant event. Do not repeatedly express sadness or impatience to demand attention.
- Idle: very small body motion; occasional full blink. The viewer plays the idle loop; other activities remain still concepts.
- Motion scale by character: square and diamond compact; circle and star broader; crescent and heart gentle; triangle brisk; bean asymmetrical.
- Boots keep a believable contact plane for grounded poses; lifted-foot poses need a stable center of mass.
- Blinks close both eyelids cleanly. Keep pupils inside sclera; eyes track together unless intentionally surprised.
- Speaking mouth should follow actual audio. For text streaming alone, retain a quiet mouth with a light presenting gesture.
- Status-aware motion beats a generic perpetual bounce. Waiting, errors and requests for approval settle rather than suggesting ongoing progress.

## Accessibility and display

- Every activity has a persistent text label and explicit recovery action. Color and expression are supplementary.
- Character selection and state controls have visible labels, keyboard operation and visible focus. Screen readers receive a concise update for an intentional state change; do not announce every blink.
- Offer reduced motion: still poses with a short fade or instant transition; suppress bounce, sway and looping. The viewer starts paused when the browser requests reduced motion and provides Play/Pause and Restart controls.
- Announce critical errors immediately; other status text can use polite announcements. Do not use a blinking avatar as the sole alert.
- On small or round displays, place the full silhouette inside a circular safe area with roughly 12% inset. Put labels outside the artwork when space allows. Verify crops, gloves, boots and contrast at the actual device resolution before use.
- Preserve the character's accessible name independent of color: “Triangle, thinking,” rather than “yellow.”
- On narrow screens, controls stack above the pose. The full sheet remains available as a zoomable image link.

## Production handoff

- Each sheet uses the same 4 × 4 order. JSON row/column coordinates identify static concept cells only.
- For the remaining state animations, approve acting range and create consistently registered isolated poses or an editable rig. The generated contact sheets have small scale/position differences and are not drop-in sprite atlases.
- Idle is delivered as generated-keyframe animation. Generate or rig listening, thinking, working, answering, needs-input, complete and error next. Add researching and sleeping, then short emotional overlays.
- Export clips with stable framing and a common rest pose, plus transparent assets if the chosen runtime supports them. This task includes opaque idle videos, GIFs and WebPs; transparent cutouts, editable rigs and installable pet packages are not included.
- Keep the microphone, permission and task-event implementation outside the character artwork.

## Open decisions

Target runtime and physical display are not yet specified. The preview exports use four-second loops, 512 × 512 H.264 MP4 at 24 fps, plus 384 × 384 GIF and WebP. Production rig versus sprite delivery, transparency, audio synchronization, and final state timing remain to be chosen. The core state meanings, color identities and accessory rules are defined.


## Delivered idle animations

Each character has 16 generated sequential poses, including a full blink and a small gesture. Local assembly registers the boots, applies timed holds, and interpolates motion into a four-second loop. The brief blink uses the original eyelid poses to prevent pupil ghosting. These are rendered animation studies with some pose-to-pose variation, not editable 3D rigs. The source sheets and exact prompts are retained.

- MP4: 512 × 512, H.264, 24 fps, 96 decoded frames, four seconds, silent.
- GIF and WebP: 384 × 384, indefinitely looping. GIF delays are quantized by the format.
- Background: opaque black. No transparency is claimed.
- Pose vocabulary: triangle wave; circle buoyant greeting; square measured wave; star two-hand greeting; crescent gentle lean and wave; bean curious cheek touch; heart welcoming open palms; diamond compact greeting.
- Checks: each clip is decoded to confirm frame count, measurable motion and matching loop endpoints. Reports live alongside each clip. The included browser smoke test covers actual playback, pause/restart, switching, static states, mobile layout and reduced motion. Browser execution was blocked by an unavailable admin-policy security check during this handoff; the smoke test has not been run. Physical-display and assistant integration have not been tested.

Rebuild with `python3 scripts/assemble-shape-loops.py triangle circle square star crescent bean heart diamond`. This requires Python, Pillow, NumPy and ffmpeg. Generated artwork uses built-in image generation; assembly is local.
