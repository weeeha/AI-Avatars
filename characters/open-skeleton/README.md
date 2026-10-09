# Open Skeleton

Round ivory mechanical character with a neck-free silhouette, realistic gray-green eyes, articulated lids, exposed brass/silver structure, and a hinged jaw.

[Animation gallery and event simulator](preview.html) · [Manifest](manifest.json) · [Nine emotion clips](emotions/README.md) · [Activity contact sheet](activities/contact-sheet.jpg)

## Playable activities

| Activity | Motion | Playback | MP4 / GIF |
| --- | --- | --- | --- |
| Idle | Original occasional blink | Loop | [MP4](idle.mp4) / [GIF](idle.gif) |
| Starting | Two-stage lid opening, focus, ready nod | Return to idle | [MP4](activities/starting.mp4) / [GIF](activities/starting.gif) |
| Listening | Open attentive gaze, acknowledgment nod, blink | Loop | [MP4](activities/listening.mp4) / [GIF](activities/listening.gif) |
| Thinking | Original upward glance and return | Loop | [MP4](thinking.mp4) / [GIF](thinking.gif) |
| Researching | Horizontal eye sweeps, downward row resets | Loop | [MP4](activities/researching.mp4) / [GIF](activities/researching.gif) |
| Coding | Short downward saccades, upward check, decisive nod | Loop | [MP4](activities/coding.mp4) / [GIF](activities/coding.gif) |
| Answering | Original speech-like jaw phrases and pauses | Loop | [MP4](answering.mp4) / [GIF](answering.gif) |
| Waiting | Patient side glance, slow blink, centered rest | Hold | [MP4](activities/waiting.mp4) / [GIF](activities/waiting.gif) |
| Needs input | One raised brow, uneven blink, questioning tilt | Hold | [MP4](activities/needs-input.mp4) / [GIF](activities/needs-input.gif) |
| Complete | Softened gaze, pleased jaw release, double nod | Return to idle | [MP4](activities/complete.mp4) / [GIF](activities/complete.gif) |
| Error | Brief wide-eyed surprise, jaw opening, small shake, attentive recovery | Hold | [MP4](activities/error.mp4) / [GIF](activities/error.gif) |
| Sleeping | Slow lid closure, downward inclination, closed-eye rest | Hold | [MP4](activities/sleeping.mp4) / [GIF](activities/sleeping.gif) |

The nine emotional reactions are happy, curious, surprised, confused, concerned, frustrated, playful, proud, and relieved. Neutral/calm means the idle pose. All 21 clips use a 512 × 512 black canvas. The gallery crops the display into a circle with clearance around the head.

## Simulator and interruption rules

Choose an **Activity or condition**, then an **Emotion reaction**. Reactions play once and return to the selected activity; the selected activity restarts its entry rather than resuming mid-gesture. A new activity interrupts the reaction immediately. Choosing another reaction replaces the old one. **Return to activity** cancels a reaction. Starting and complete return to idle motion while retaining their event label; error never automatically changes into success. Waiting, input, error, and sleeping hold a settled pose until another event. No busy animation implies progress during a held condition.

The grid is a clip-comparison tool: **Loop previews** repeats even one-shot entries when enabled. The simulator follows each clip's actual `defaultLoop` and `onEnd` rules. Pause, replay, speed, and gallery filters operate locally. Gallery controls do not change the simulator's activity.

Reduced motion starts every video paused and uses a representative still (settled closed lids for sleeping). A preference change to reduced motion stops all videos immediately; changing back does not restart them. **Play character**, **Play all**, and individual grid **Replay** are explicit playback opt-ins. A reaction chosen while paused remains a still until played or cleared. Conditions marked as held stay still even when Play is enabled.

## Semantic mappings

The manifest lists aliases separately from original clips. Working/checking use coding; searching uses researching; waking uses starting; speaking uses the silent answering study; success uses complete. Approval uses the needs-input entry and hold.

| Condition | Reused pose | Exact meaning |
| --- | --- | --- |
| Offline | Waiting, settled | No connection |
| Reconnecting | Waiting, settled | Connection remains unconfirmed |
| Permission denied | Error, settled | Action did not run |
| Paused | Waiting, settled | Work is stopped |
| Cancelled | Waiting, settled | Work ended early |
| Partial result | Needs input, settled | Review what remains |

These are labelled fallbacks, not six additional bespoke animations. `window.openSkeletonPreview.setActivity(id)`, `.react(id)` and `.getState()` expose the local simulator. There is no live assistant or task integration; selecting an event is a manual preview.

## Editable sources and local reproduction

Edit `studies/open-skeleton.fragment.html`, then run `npm run build` and `npm run check`. The committed preview HTML, CSS, and JavaScript are generated. The source embeds the manifest to keep direct `file://` playback available; `npm run test:media` checks that the embedded copy matches `manifest.json`.

The original three activity clips and nine emotional clips are unchanged. They are locally timed generated keyframes with a stop-motion character. The nine new activities use a local two-texture rig over the original neutral and closed-lid artwork (`frames/idle/00.png` and `03.png`). Independent displacement fields articulate gaze, eyelid surrounds, brow linkages and jaw; iris protection preserves the circular photographic pupils, and partial lid closure reveals the original lid texture from top to bottom. Nods and tilts are secondary motion. No new images were generated or uploaded for this completion work. These are 2D textured animation studies, not a 3D mechanical simulation or phoneme-accurate lip sync.

Ready-to-play files are committed. Rebuilding is optional and needs Python 3, Pillow, NumPy, and ffmpeg with libx264 on PATH:

```sh
python3 characters/open-skeleton/assemble_activities.py
```

[Exact motion keys and assembly report](activities/assembly-report.json) · [Local rig source](assemble_activities.py)

To rebuild the unchanged older media: `python3 characters/open-skeleton/assemble_loops.py` and `python3 characters/open-skeleton/emotions/assemble.py`. Their original prompts and source sheets remain available.

## Verification and limits

```sh
npm run build
npm run check
npm run test:media
npm test
python3 tests/skeleton-motion.py
```

The media test verifies all 21 assets, metadata, aliases and seek-range behavior. The decoded-motion check inspects the nine new MP4s independently of their declared timelines: unique exports, actual local facial movement rather than global pan, duration, round framing, loop seams and held ending poses. Browser coverage exercises all 12 activities, nine reactions, reaction return, interruption, fallbacks, pause/resume, live and initial reduced-motion preferences, and a 320px viewport. Rendered activity poses and desktop/mobile layouts receive screenshot review.

Speech synchronization, assistant events and physical-display fit remain unverified. All sound is absent by design.
