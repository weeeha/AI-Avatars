# AI Avatars

A home for interactive character and animation studies designed to read on a round display.

## Run the gallery

```sh
npm start
```

Open **http://127.0.0.1:4173**. Node.js 20 or newer is required. The gallery has no runtime package dependencies, CDN requests, account requirements, or API keys. You can also open `index.html` directly.

## Included studies

- **Shape companions:** eight soft 3D-look characters, one main color each, white gloves and black boots. Each has a playable four-second idle loop (MP4, GIF and WebP) and 16 static emotion/activity concepts. [Animation and behavior guide](docs/shape-cast.md).

- **Open Skeleton:** a round ivory mechanical face with nine emotional reactions plus idle, thinking, and answering. Includes 12 silent MP4/GIF clips, generated source artwork, and prompts. [Character pack](characters/open-skeleton/README.md).

- **Dot flock:** a round sculpture of individually shaded blue dots, with clear gaps, curved eyelids, rounded irises, and dark pupils. Supports expressive motion, pointer disturbance, and scatter/reform.
- **Red eye:** a red glass lens with blue reflections and an expressive luminous aperture. Both cinematic faces combine 10 activities, 10 emotions, and 6 temporary reactions. [Behavior guide](docs/cinematic-faces.md).
- **Prismatic lenses — character states:** idle, listening, talking, thinking, writing code, and complete. Includes a demo sequence, playback speed, pause, and round/square display views.
- **Ten motion ideas:** liquid core, twin moons, ribbon knot, hourglass, fireflies, radar sweep, helix, tide, bloom, and curious eyes.
- **Six palettes:** prismatic, pink, cyan, lilac, amber, and mint, shared across both studies.

The procedural studies are original browser-rendered concepts based on supplied visual references. Open Skeleton uses locally assembled, generated keyframes with a stop-motion character. Shape companions use built-in image generation and local frame assembly with optical-flow interpolation and crisp blink poses. Talking uses simulated timing; the studies are not connected to live speech, a microphone, an agent, or physical hardware. Reduced-motion settings start the previews paused.

## Edit

The editable sources are listed in `catalog.json` under `studies/`. Each includes its markup, styling, and animation logic. `studies/cinematic-faces.fragment.html` contains Dot flock and Red eye; the lens studies include their WebGL shaders.

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

The smoke check loads the standalone studies, checks graphics initialization, state/palette switching, animation playback, local preference persistence, reduced motion, and narrow-screen layout. `npm run check` also confirms that generated files are current and have no machine-specific paths or conversation-host API calls.

## Add characters

Keep each character family in its own folder under `characters/`, add its editable study under `studies/`, and register it in `catalog.json` and the gallery. Preserve existing studies when exploring a new direction. Describe unverified hardware or agent integration as a proposal until it has been tested.

Reference: [circular lens visual inspiration](https://www.pinterest.com/pin/167829523611137649/). The reference video and screenshots are not included in this repository.
