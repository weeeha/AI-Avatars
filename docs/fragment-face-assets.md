# Asset provenance

The initial repository was empty. These files move the existing SuperClock **Fragment** and **Third Eye** character prototypes into a standalone project.

- `assets/fragment-faces/face-atlas.jpg`: generated SuperClock concept artwork, created during the design exploration. It contains three concept crops; Fragment and Third Eye are implemented. The original uploaded reference photographs are not included.
- `assets/fragment-faces/hello.mp3`: synthetic demo speech generated with the macOS Samantha system voice.
- `assets/fragment-faces/iris-detail-v1.jpg`: generated photographic iris texture, created with the built-in image-generation tool and converted to a 1024 px JPEG for mipmapped rendering. See `iris-generation.md` for the exact prompt. It uses no reference photograph or uploaded image as input.
- `studies/fragment-faces.fragment.html`: measured amplitude of the included audio, used for mouth animation.
- Rendering and interaction code: developed for the SuperClock character preview, then separated into editable source modules for this repository.

No external avatar library, hosted AI service, or third-party character pack is required at runtime. Playwright is used only for development checks.
