# Roadmap

Features and improvements we could add to the playground, grouped by area.
Tracks ideas only — see individual plan files for designed proposals.

## Slidev Parity (currently skipped)

See [[codebase/starter-template-features]] for current support matrix.

- `<script setup>` in slides — would require full SFC compilation; defines the
  playground vs. real Slidev boundary
- `<Toc>` component — needs cross-slide analysis at render time
- `v-motion` directive — requires `@vueuse/motion` + click integration
- `v-drag` / `v-drag-arrow` — authoring affordance, not just rendering
- `<Tweet>` component — Twitter widget API + external scripts
- TwoSlash type hovers — ~3 MB TypeScript bundle; deferred
- Monaco editor blocks (`{monaco}` fences) — ~4 MB dependency
- Slide layouts beyond what render.ts supports (cover, two-cols, image-right…)
- `<Transform>` component for scaling content
- `<SlideCurrentNo>` / `<SlidesTotal>` / `<TocList>` helpers
- Global layer / `global-bottom.vue` / `global-top.vue` equivalent
- Addons system (probably out of scope for a playground)

## Editor

- Multi-cursor / column selection polish
- Vim mode (test file already exists — `src/vim-mode.browser.test.ts`)
- Emacs mode
- Markdown table editing helpers
- Slide reordering via drag in a slide list sidebar
- Insert-slide / duplicate-slide / delete-slide commands
- Snippet library (insert common Slidev directives)
- Frontmatter autocomplete based on schema
- Image upload → base64 or external paste handling
- Find-and-replace across slides
- Format-on-save for markdown
- Outline view (H1/H2 jump list)

## Presentation

- `Home` / `End` shortcuts to jump to first/last slide
- Overview keyboard navigation (arrow keys to move between thumbnails)
- Presenter mode with second window (current slide + next + notes + timer)
- Slide timer / elapsed time display
- Laser pointer / drawing overlay
- Recording mode (export to video / GIF)
- Auto-advance with configurable interval
- Slide bookmarks / favorites within a deck

## Sharing & Persistence

- Export to PDF (client-side via print stylesheet or pdf-lib)
- Export to PPTX
- Export to standalone HTML bundle
- Import from a Slidev project's `.md` file (drag-and-drop)
- Save to local storage as named decks (multiple recent decks)
- GitHub Gist save/load integration
- Shortened share URLs (would require a backend — out of scope?)
- QR code for the current share URL (useful for live demos)

## Theming

- Theme picker for built-in Slidev themes (seriph, default, apple-basic, etc.)
  — needs per-theme CSS bundled or loaded
- Live preview of theme changes in the config panel
- Per-slide background image picker with crop/position
- Font picker with Google Fonts loading
- Custom CSS editor (scoped to the deck)

## Custom Components

- New file / delete file / rename file UI for the component editor
- Component file tree (folders) instead of flat list
- TypeScript support in component files (currently Vue SFC only?)
- Example component templates (counter, chart, callout)
- Per-component error overlay with line numbers

## Diagrams & Code

- D2 diagrams
- Graphviz / dot
- Excalidraw embed
- Code execution sandbox (run JS/TS snippets inline)
- Syntax highlighting theme picker (Shiki themes)
- Diff fences (`diff-js`) with proper colors

## Mobile / Touch

- Swipe gestures for slide navigation in presentation
- Touch-friendly config panel
- Better small-screen overview layout

## Developer / Quality

- Visual regression tests for built-in `Slidev*.vue` components
- Performance budget for render pipeline (e.g. 50ms per slide)
- Service worker for offline use
- Telemetry-free usage stats (slide count, render time) shown to user

## Designed Proposals (separate plan files)

- [[plans/preparser-extensions]] — move regex preprocessors into Slidev
  preparser extensions
