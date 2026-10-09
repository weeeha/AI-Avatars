# AI Avatars

A home for interactive character and animation studies designed to read on a round display.

## Run the gallery

```sh
npm start
```

Open **http://127.0.0.1:4173**. Node.js 20 or newer is required. The gallery has no runtime package dependencies, CDN requests, account requirements, or API keys. You can also open `index.html` directly.

## Included studies

- **Open Skeleton:** a round ivory mechanical face with 12 activities and nine emotional reactions. Includes 21 silent MP4/GIF clips, a local event simulator with interruption and reaction return, labelled system-condition fallbacks, original artwork, and local motion sources. [Character pack](characters/open-skeleton/README.md).
- **Fragment & Third Eye:** photographic eyes with detailed iris texture, separate pupil targets, coordinated or independent gaze, eleven emotions, twenty-two statuses, and six reactions. Includes real synthetic demo speech and local browser voices for custom text. [Behavior guide](docs/fragment-faces.md).
- **Dot flock:** a round sculpture of individually shaded blue dots, with clear gaps, curved eyelids, rounded irises, and dark pupils. Supports expressive motion, pointer disturbance, and scatter/reform.
- **Red eye:** a red glass lens with blue reflections and an expressive luminous aperture. Both cinematic faces combine 22 activity and condition states, 11 emotions, and 6 temporary reactions. [Behavior guide](docs/cinematic-faces.md).
- **Prismatic lenses — character states:** idle, listening, talking, thinking, writing code, and complete. Includes a demo sequence, playback speed, pause, and round/square display views.
- **Ten motion ideas:** liquid core, twin moons, ribbon knot, hourglass, fireflies, radar sweep, helix, tide, bloom, and curious eyes.
- **Six palettes:** prismatic, pink, cyan, lilac, amber, and mint, shared across both studies.
- **[Oracle](characters/oracle/README.md):** a three-eyed white statue with 34 expression, assistant, and clock modes with a separate emotion layer. Shimmering stars change into hearts, crescents, diamonds, pulses, and orbiting lights. Includes artwork, a character manifest, and generation provenance.

The procedural studies are original browser-rendered concepts based on supplied visual references. Open Skeleton preserves its generated keyframe clips and adds nine locally articulated activities using the original face artwork. Fragment and Third Eye include synthetic voice playback; their demo mouth motion follows audio amplitude and custom phrases use approximate speech timing. Other studies simulate talking. The studies are not connected to a microphone, an agent, or physical hardware. Reduced-motion settings start the previews paused.

## Abstract character families

- **Seven luminous faces:** Constellation, Halo, Prism, Knot, Portal, Sun, and Pulse.
- **Sixteen core eyes:** Wheatley through Aperture, with their original iris motifs, optional housing, and clock time.
- **Assistant iris ring:** detailed branching fibres, dark pupil, and seven palettes.
- **Procedural fractal presence:** dense recursive red, blue, and white plumes.

Every one of these 25 designs combines 12 activities with seven independent expressions. Waiting, input, error, completion, waking and sleep have entry/hold/exit behavior. Controls include a simulated demo, interruption, recovery, temporary acknowledgment, live reduced-motion support, and labeled operational fallbacks. [Behavior and individual design guide](docs/abstract-characters.md).

## Edit

The editable sources are listed in `catalog.json` under `studies/`. Each includes its markup, styling, and animation logic. `studies/cinematic-faces.fragment.html` contains Dot flock and Red eye; the lens studies include their WebGL shaders. Oracle's editable source is `studies/oracle.fragment.html`, with character assets and documentation in `characters/oracle/`.

```sh
npm run build
npm run check
```

The build writes ordinary HTML, CSS, and JavaScript to each family's folder under `characters/`. These generated files are committed so the gallery can run immediately. Preferences are saved locally when browser storage is available. Dot flock and Red eye share their own character, activity, emotion, reaction, and tuning settings.

## Browser verification

```sh
npm install
npx playwright install chromium
npm test
```

The smoke checks exercise gallery links, graphics initialization, state and emotion performances, animation playback, interruption and return, local preferences, reduced motion, narrow-screen layout, photographic pupil confinement, and explicit voice playback. `npm run check` verifies current portable generated previews.

## Add characters

Keep each character family in its own folder under `characters/`, add its editable study under `studies/`, and register it in `catalog.json` and the gallery. Preserve existing studies when exploring a new direction. Describe unverified hardware or agent integration as a proposal until it has been tested.

Reference: [circular lens visual inspiration](https://www.pinterest.com/pin/167829523611137649/). The reference video and screenshots are not included in this repository.
