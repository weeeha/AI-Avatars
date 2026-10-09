# AI Avatars

A home for interactive character and animation studies. The first collection explores light and movement beneath a fixed grid of circular glass lenses, designed to read on a round display.

## Run the gallery

```sh
npm start
```

Open **http://127.0.0.1:4173**. Node.js 20 or newer is required. The gallery has no runtime package dependencies, CDN requests, account requirements, or API keys. You can also open `index.html` directly.

## Included studies

- **Prismatic lenses — character states:** idle, listening, talking, thinking, writing code, and complete. Includes a demo sequence, playback speed, pause, and round/square display views.
- **Ten motion ideas:** liquid core, twin moons, ribbon knot, hourglass, fireflies, radar sweep, helix, tide, bloom, and curious eyes.
- **Six palettes:** prismatic, pink, cyan, lilac, amber, and mint, shared across both studies.

These are original browser-rendered concepts based on supplied visual references. Talking uses simulated timing; the studies are not connected to live speech, a microphone, an agent, or physical hardware. Reduced-motion settings start the previews paused.

## Edit

The editable sources are `studies/prismatic-lenses.fragment.html` and `studies/lens-motion-ideas.fragment.html`. Each includes its markup, styling, animation logic, and shaders.

```sh
npm run build
npm run check
```

The build writes ordinary HTML, CSS, and JavaScript to `characters/prismatic-lenses/`. These generated files are committed so the gallery can run immediately. The small local-state adapter in `assets/preview-state.js` replaces the conversation host's state bridge; palette and playback choices are saved in the browser when storage is available.

## Browser verification

```sh
npm install
npx playwright install chromium
npm test
```

The smoke check loads both standalone studies, checks graphics initialization, state/palette switching, animation playback, local preference persistence, reduced motion, and narrow-screen layout. `npm run check` also confirms that generated files are current and have no machine-specific paths or conversation-host API calls.

## Add characters

Keep each character family in its own folder under `characters/`, add its editable study under `studies/`, and register it in `catalog.json` and the gallery. Preserve existing studies when exploring a new direction. Describe unverified hardware or agent integration as a proposal until it has been tested.

Reference: [circular lens visual inspiration](https://www.pinterest.com/pin/167829523611137649/). The reference video and screenshots are not included in this repository.
