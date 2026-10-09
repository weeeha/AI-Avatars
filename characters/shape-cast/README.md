# Shape companions

Eight shape characters with one main color each, white gloves and black boots. Each has a playable four-second idle loop, six core emotional expressions and ten assistant activity poses.

- [Open the animation and state viewer](index.html)
- [Behavior and animation guide](../../docs/shape-cast.md)
- [State definitions](../../studies/shape-cast.states.json)
- [Approved cast](concepts/cast.png)
- [Play all eight together](all-idle.mp4) · [Looping GIF](all-idle.gif)

Eight idle animations are included as 512 × 512 MP4s at 24 fps, plus 384 × 384 animated GIF and WebP exports. Each loops for four seconds on black. The other 128 pose cells are static state concepts. No rigged models or assistant integration are included. Artwork was created with built-in image generation; clips are assembled locally with stabilized framing and optical-flow interpolation. Small pose and geometry changes remain. Exact prompts are retained in `generation-prompts.json`.


To rebuild the clips, install Python with Pillow and NumPy plus ffmpeg, then run `python3 scripts/assemble-shape-loops.py triangle circle square star crescent bean heart diamond` from the repository root. Source animation sheets remain unchanged in `animation-sources/`; each output folder includes a measured verification report.

Use `python3 scripts/assemble-shape-loops.py --comparison` to rebuild the combined preview from the eight existing clips.
