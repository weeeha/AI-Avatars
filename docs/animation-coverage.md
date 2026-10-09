# Animation coverage

All 50 selected designs are registered in the gallery. This integration combines the seven family review branches while preserving their source artwork and original renderers.

| Family | Designs | Completed behavior | Family PR |
| --- | ---: | --- | --- |
| Oracle | 1 | 34 expression, activity, condition and clock modes; independent emotion layer; temporary reactions; settle and interruption behavior | [#1](https://github.com/weeeha/AI-Avatars/pull/1) |
| Fragment and Third Eye | 2 | 22 statuses, 11 emotions, 6 reactions; synthetic speech; independent eyes; paused/voice restoration | [#2](https://github.com/weeeha/AI-Avatars/pull/2) |
| Shape companions | 8 | 128 browser performances: 10 activities and 6 reactions per pet; neutral idle; 10 labelled conditions, including waking/waiting and working aliases | [#3](https://github.com/weeeha/AI-Avatars/pull/3) |
| Dot flock and Red eye | 2 | 22 activity/condition states, 11 emotions, 6 reactions; preserved particle and glass renderers | [#4](https://github.com/weeeha/AI-Avatars/pull/4) |
| Open Skeleton | 1 | 12 activities and 9 emotional reactions; 21 MP4/GIF clips; local event preview and labelled fallback conditions | [#5](https://github.com/weeeha/AI-Avatars/pull/5) |
| Luminous faces | 7 | 12 activities × 7 independent expressions; all original visual motifs | [#6](https://github.com/weeeha/AI-Avatars/pull/6) |
| Core eyes | 16 | 12 activities × 7 independent expressions; original iris designs, optional housing and clock | [#6](https://github.com/weeeha/AI-Avatars/pull/6) |
| Assistant iris ring | 1 | 12 activities × 7 independent expressions; seven palettes and branching shader | [#6](https://github.com/weeeha/AI-Avatars/pull/6) |
| Procedural fractal presence | 1 | 12 activities × 7 independent expressions; dense recursive field and fallback renderer | [#6](https://github.com/weeeha/AI-Avatars/pull/6) |
| Prismatic lenses | 1 | 12 activities × 7 expressions; six palettes, speed and round/square display | [#7](https://github.com/weeeha/AI-Avatars/pull/7) |
| Lens motion ideas | 10 | 12 activities × 7 expressions for each original design; comparison grid and individual links | [#7](https://github.com/weeeha/AI-Avatars/pull/7) |

The shared activity vocabulary covers idle, waking, listening, thinking, researching, working/coding/checking, answering/speaking, waiting, input/approval, complete, error/recovery, and sleep. Families retain their original vocabulary through explicit aliases. Neutral/calm, happy, curious, surprised, confused, concerned and playful are available as poses, overlays or temporary reactions according to the character family. Operational conditions may reuse a quiet pose with an explicit label.

## Verification

Run `npm run build`, `npm run check`, `npm test`, `npm run test:shape`, `npm run test:media`, and `python3 tests/skeleton-motion.py`.

The browser suite covers 2,100 abstract and 924 lens activity/expression combinations, 128 shape performances, face expressions and motion, original Oracle modes, synthetic voice behavior, all skeleton activities and emotions, interruptions and reaction returns, paused state/character changes, live reduced motion, material-time continuity, clock updates while paused, mobile layouts and persistence. Lens graphics-context recovery was also checked separately. `npm run check` also verifies one gallery link per character and every local page reference. Media checks decode preserved idle clips and new articulated skeleton clips, check framing and terminal behavior, and verify seek ranges.

## Boundaries

These are standalone visual studies with manual preview controls. Fragment/Third Eye include explicit synthetic voice playback; other speech-like motion is silent simulation. Operational conditions and completion are selected demonstrations, not live agent status. Physical round-display performance and readability, live microphone/agent bindings, production rigs, and additional media exports remain separate work.
