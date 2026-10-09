# AI Avatars

This repository contains browser-based character studies and their editable sources.

- The source of each study is listed in `catalog.json`. Edit `studies/*.fragment.html`, then run `npm run build`; do not hand-edit generated files in `characters/`.
- Keep the gallery, catalog, and README aligned when adding a character family.
- Preserve existing explorations when adding new ideas. Keep round-display composition and readable behavior at small sizes unless the user requests another direction.
- Previews must work without conversation-host APIs, remote runtime dependencies, or API keys. `assets/preview-state.js` provides optional local preference storage.
- Run `npm run check` after edits. Run the browser smoke check for changes to behavior, generated-page integration, or shared controls.
- Distinguish visual simulations from real speech, agent, and physical-hardware integrations. Do not claim those integrations until verified.
