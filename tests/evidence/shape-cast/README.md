# Shape performance review evidence

These images were captured from the local Chromium viewer after building the editable study. They are render evidence, not newly generated source artwork.

- `activity-contact.webp`: ten activities for all eight characters.
- `emotion-contact.webp`: six emotional reactions for all eight characters.
- `motion-sequence.webp`: working and playful performances at 0.35 and 0.85 seconds for every character. Compare the white gloves and facial features; the whole image is not simply panned or zoomed.
- `blink-contact.webp`: fully closed eyelids for all eight characters, also checked with rendered white-pixel reduction.
- `mobile-reduced-round.png`: 320 px viewport with reduced motion and circular framing enabled.
- `runtime-motion-report.json`: independent rendered hashes for the 128 state pairs plus the exercised interaction cases.

Reproduce with `npm run build`, `npm test`, then `python3 scripts/shape-contact-sheets.py`. Raw frames are written to ignored `test-results/shape-cast/`. Tests also exercise video playback, transitions, current-activity reaction return, critical interruptions, settled conditions, one-shot completion, durable outcomes, live reduced-motion changes and WebGL-unavailable fallback. The separate `npm run test:shape` command verifies motion profiles, texture anchors and decoding of all original idle videos.

Source preparation and browser performance rendering are local. Original source sheets and idle exports are preserved. No external generation, reference uploads, physical-display test or assistant/microphone integration is claimed.
