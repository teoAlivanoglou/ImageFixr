<p align="center">
  <img src="src/assets/logo.svg" alt="ImageFixr" width="130" />
</p>

<h1 align="center">ImageFixr</h1>

<p align="center">
  A GPU-accelerated image framing tool for screenshots, photos, and social media posts.<br/>
  Drop an image → adjust background, borders, shadow → export at up to 5K.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/svelte-5-ff3e00?logo=svelte&logoColor=white" alt="Svelte 5" />
  <img src="https://img.shields.io/badge/pixi.js-8-e72264?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyTDIgN2wxMCA1IDEwLTV6Ii8+PC9zdmc+" alt="PixiJS 8" />
  <img src="https://img.shields.io/badge/typescript-6-3178c6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/tailwind-4-06b6d4?logo=tailwindcss&logoColor=white" alt="Tailwind 4" />
</p>

---

## Why

Every blog post, portfolio and tweet looks better when screenshots aren't raw rectangles floating in the void. Online tools that do this exist, but often require an account, use your images for training or advertising, or do so many things that make your workflow a headache.

**ImageFixr** runs entirely in-browser. No uploads, no accounts, no server - your images never leave your device. It renders everything on the GPU in real time, and exports pixel-perfect PNGs at the resolution of your choice.

## Features

- **Background layer** - blurred mirror of your image (or a custom upload / solid color), scaled independently
- **Borders** - inner, center, or outer alignment with per-pixel precision
- **Drop shadow** - pixel perfect drop shadow that looks good regardless of image or size
- **Safe areas** - Standard SMPTE title-safe and action-safe margins, plus custom per-side margins in `%` or `px`
- **Multiple aspect ratios & resolutions** - from 512p avatars to 5K ultrawide, with ratio-aware presets
- **Foreground blur & scale** - contain-to-cover interpolation so scaling past 1× smoothly transitions to cover behavior
- **Real-time preview** - GPU-rendered canvas with RAF-throttled updates; the export output matches what you see, in the resolution you need
- **Native save dialog** - uses the File System Access API to remember your last save directory (falls back to download on Firefox/Safari)
- **Image persistence** - IndexedDB storage with TTL-based session expiry and a per-image pin toggle
- **Undo / Redo** - 50-step visual history that ignores UI-only state like collapsed sections
- **Dark mode** - system-aware with instant toggle, no flash, no reload
- **i18n** - English and Greek via Paraglide.js, runtime-switchable
- **Responsive** - 4-tier adaptive layout: desktop-landscape, desktop-portrait, mobile-landscape, mobile-portrait

## Technical Highlights

The interesting engineering decisions, for anyone reading the source:

### Custom GLSL Drop Shadow

The shadow isn't a blurred copy of the foreground - it's an **analytical signed-distance-field shadow** rendered on a mesh with a [custom fragment shader](src/lib/shaders/sdf-shadow.frag). It evaluates the Gaussian integral of a box shape using the `erf()` function, producing mathematically correct soft shadows in a single pass with no texture sampling. This means the shadow scales cleanly to any resolution without banding or blur artifacts.

### Mirror-Clamped Blur Filter

PixiJS's built-in blur wraps or clamps at texture edges, creating visible seams on background images. The [custom blur filter](src/lib/filters/clamped-blur-filter.ts) uses **mirror-repeat UV sampling** in the shader to reflect edge pixels instead of clamping them, eliminating the dark/bright edge halo. It ships both WebGL (GLSL) and WebGPU (WGSL) shader variants and uses multi-pass progressive strength reduction for quality.

### Resolution-Independent Export

The viewport is a scaled-down preview - export works by temporarily resetting the scene to 1:1 logical scale, rendering into an offscreen `RenderTexture` at full resolution, then restoring the preview transform. Blur strength is recalculated relative to a 1080p baseline (`pixelScale = min(w,h) / 1080`) so a "blur: 50" looks identical whether you export at 720p or 4K.

### State Architecture

All settings live in a single [`PersistedState`](src/lib/state.svelte.ts) (Svelte 5 runes + `localStorage` with cross-tab sync via `runed`). Undo/redo is powered by `StateHistory` with a **visual snapshot diff** - UI-only keys (collapsed sections, swatches) are stripped before comparison, so expanding an accordion doesn't pollute your undo stack.

### Layout Engine

The [layout module](src/lib/viewport/layout.ts) computes all geometry (margins → safe area → contain/cover scale → border shrink → shadow quad padding) as pure functions of settings and texture dimensions. This means layout is testable without a DOM and the viewport just applies the computed result.

## Stack

| Layer          | Choice                                   | Why                                                                       |
| -------------- | ---------------------------------------- | ------------------------------------------------------------------------- |
| **Rendering**  | PixiJS 8                                 | WebGL/WebGPU canvas with scene graph, texture management, filter pipeline |
| **UI**         | Svelte 5 + Tailwind 4                    | Runes for fine-grained reactivity without virtual DOM overhead            |
| **Components** | shadcn-svelte (bits-ui)                  | Accessible primitives adapted for this app's design system                |
| **State**      | runed (`PersistedState`, `StateHistory`) | Persistence + undo without a state management library                     |
| **i18n**       | Paraglide.js                             | Compiled message functions, no runtime dictionary lookup                  |
| **Build**      | Vite 8                                   | Manual chunk splitting (PixiJS / vendor-ui / app) for parallel loading    |
| **Tests**      | Node.js native test runner               | Zero-dependency unit tests for layout, format, and state logic            |

## Running Locally

```bash
git clone https://github.com/teoAlivanoglou/image-fixr.git
cd image-fixr
npm install
npm run dev
```

| Command         | Description                     |
| --------------- | ------------------------------- |
| `npm run dev`   | Start dev server                |
| `npm run build` | Type-check + production build   |
| `npm run test`  | Run unit tests                  |
| `npm run check` | Svelte + TypeScript diagnostics |

## License

[GPL-3.0](LICENSE) — free to use, fork, and modify, but derivatives must remain open source and credit this project.
