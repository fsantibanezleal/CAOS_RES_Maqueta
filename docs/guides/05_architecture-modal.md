# Guide 05, the in-app architecture modal

The header's info button opens the "Architecture / How it was built" modal (ADR-0058). The shared shell
(`@fasl-work/caos-app-shell`) provides the button and the modal; Maqueta provides the content in
`frontend/src/architecture.ts`, passed to the shell as `architecture` in `frontend/src/main.tsx`.

## The five tabs

| id | Tab | Shows |
|---|---|---|
| `app` | The app | how geoscena and the pipeline turn open sources into a SceneBundle the app replays, and which geoscena source the bundles were baked from |
| `lanes` | The lanes | the offline bake (local, heavy geo libraries, network) versus the static web replay |
| `web` | Web flow | index, then manifest, then layers; the scene materials; picking and the analysis tools |
| `science` | The science | the height-provenance ladder and the meshing |
| `contracts` | Data contracts | CONTRACT 1 (layer provenance) and CONTRACT 2 (the manifest and its TypeScript mirror) |

Each tab has an English and a Spanish body and an inline SVG diagram built with the `svg()` helper in
`architecture.ts`. The diagrams use the shell's CSS variables (`--color-fg`, `--color-border`,
`--color-accent` and so on), so they follow the light or dark theme.

## Changing it

Edit `architecture.ts`, then `npm run build` (the type check covers the `ArchitectureConfig` shape). Open the
modal in both themes and both languages and check every tab before deploying: the text and the diagram
must describe the app as it is.
