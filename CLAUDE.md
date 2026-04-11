# Slidev Playground

Browser-based presentation editor with live preview. Edit Slidev markdown
in CodeMirror 6, see rendered slides in real time, enter fullscreen
presentation mode with click animations. All state lives in the URL hash
(LZ-string compressed). No backend, no database, no SSR — pure client SPA.

## Commands

```
vp dev              # Start dev server
vp run check        # Format + lint + typecheck (oxlint + ESLint + tsc)
vp run lint         # Lint only (oxlint + ESLint)
vp run lint:vue     # ESLint Vue template rules only
vp test             # Run browser tests
vp build            # Build for production
```

Run `vp run check` after code changes.

## Architecture

### Layers (enforced)

Three layers with **unidirectional** dependency flow:

```
shared → features → app
```

- **Shared** — `types/`, `utils/`, `config/`, `styles/`, `composables/`, `components/`, `lint/`
- **Features** — `features/editor/`, `features/presentation/`, `features/slides/`
- **App** — `app/` (App.vue, main.ts)

Enforcement: custom oxlint rules in `src/lint/feature-boundaries.js` —
`no-cross-feature-import` and `unidirectional-flow`. Violations fail lint.

### Features

| Feature        | Responsibility                                                             | Key composables                                          | Key components                                                                                                                                                         |
| -------------- | -------------------------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `editor`       | CodeMirror editing, config panel, frontmatter, scroll sync                 | `useCodeMirror`, `useFrontmatterEditor`, `useScrollSync` | `EditorLayout`, `CodeMirrorEditor`, `ConfigPanel`, `FontAutocomplete`                                                                                                  |
| `presentation` | Fullscreen mode, click animation, keyboard nav, goto dialog, speaker notes | `usePresentation`, `useClickAnimation`                   | `PresentationOverlay`, `PresentControls`, `GotoDialog`, `SlideOverview`, `SpeakerNotes`                                                                                |
| `slides`       | Parsing, rendering pipeline, code blocks, click processing, diagrams       | Pure functions — no composables                          | `SlidevCodeBlock`, `SlidevMermaidBlock`, `SlidevMagicMove`, `SlidevKatexBlock`, `SlidevPlantUmlBlock`, `SlidevIcon`, `SlidevArrow`, `SlidevYoutube`, `SlidevPoweredBy` |

### Cross-Feature Composition

Features **never** import each other. `App.vue` is the sole composition
root — it imports from all three features and wires them together via
props, provide/inject, and callbacks.

## State Management

No Pinia, no Vuex, no Vue Router, no global plugins.

- **Pattern:** reactive `ref`/`computed` in composables, shared via `provide`/`inject`
- **Injection keys** (`src/config/injection-keys.ts`):
  - `slideDimensionsKey` → `{ slideWidth, slideHeight }` (ComputedRef)
  - `markdownKey` → `Ref<string>`
  - `componentDefsKey` → `Ref<string>`
  - `presentationClickKey` → `Ref<number>`
  - `runtimeColorSchemaKey` → `Ref<'light' | 'dark' | 'auto'>`
  - `slidevNavKey` → `{ next, prev, nextSlide, prevSlide, goToSlide }`
- **Persistence:** URL hash via `useUrlSync` — LZ-string compression, debounced at 1000ms
- **Constants** (`src/config/constants.ts`): `SLIDE_WIDTH=960`, `SLIDE_HEIGHT=540`, `DEBOUNCE_URL_MS=1000`, `SPLIT_MIN_PERCENT=20`, `SPLIT_MAX_PERCENT=80`, `PREVIEW_PADDING=48`, `SLIDE_NUMBER_WIDTH=32`

## Render Pipeline

Slide rendering flow in `src/features/slides/render.ts`:

1. **Parse** — `@slidev/parser` `parseSync()` splits markdown into slides
2. **Resolve imports** — `resolveSlidesFromMarkdown()` handles `src:` slide imports
3. **Render markdown** — markdown-it with KaTeX plugin, custom fence processing (`parseFenceInfo`), heading classes
4. **Process clicks** — `processClicks()` counts `v-click`/`v-after`/`v-clicks`, injects `data-v-click` attributes
5. **Extract & scope styles** — `extractStyles()` + `scopeCSS()` isolate per-slide CSS
6. **Split slots** — `splitSlideSlots()` extracts named slot content (`::slotName::`)
7. **Compile** — Vue runtime `compile()` with registered components (SlidevCodeBlock, SlidevIcon, etc.), cached in `compiledComponentCache`

See `docs/slidev-markdown-spec.md` for the full Slidev syntax reference (1100+ lines).

## CSS & Theming

OKLCH-based generative theme system (Linear-inspired):

- **Three inputs:** `--theme-base-hue` (default 270), `--theme-accent` (primary color), `--theme-contrast` (0–100)
- **Two token layers:**
  - `src/styles/theme-tokens.css` — shell UI: surfaces, text, borders, shadows
  - `src/styles/slidev-vars.css` — slide content: fonts, spacing, code colors
- **Dark mode:** class-based toggle via `useTheme`, flips OKLCH lightness
- **UnoCSS shortcuts:** `bg-main`, `bg-surface`, `text-main`, `text-secondary`, `border-primary`
- **All component styles:** `<style scoped>` — no global style leakage
- **Runtime theming:** `useTheme` applies CSS custom properties to `document.documentElement`

## Component Conventions

- **Script:** `<script setup lang="ts">` only — no Options API, no `defineComponent()` (exception: render-function components like `SlideLayoutHost.ts`)
- **Props:** `defineProps<{ code: string; language?: string }>()` — TypeScript generics, no runtime validation
- **Emits:** `defineEmits<{ 'update:modelValue': [value: string] }>()` — typed tuple payloads
- **Models:** `defineModel<EditorView | null>('editorView', { required: true })`
- **Heavy objects:** `shallowRef` for CodeMirror `EditorView`, Shiki highlighter, etc. — never deep `ref`
- **Bidirectional sync:** use a feedback-prevention flag (e.g., `ignoreNextUpdate`) to avoid infinite loops
- **Surgical YAML:** `useFrontmatterEditor` modifies frontmatter in-place via string manipulation, preserving comments and formatting

## Testing

All tests are browser-based. No Node unit tests.

- **Files:** `*.browser.test.ts` — run in Chromium via Playwright
- **Every test renders real `App.vue`** — no shallow mounting, no component isolation
- **Page objects:** `AppPage`, `PresentationPage`, `CodeBlockQuery`, etc. in `src/test-utils/page-objects/`
- **Deck builder:** fluent API in `src/test-utils/deck-builder.ts`:
  ```ts
  deck()
    .title('Test')
    .slide('Intro', (s) => s.text('Hello').click('Revealed'))
    .build()
  ```
- **Cleanup:** `using` keyword with `Symbol.dispose` — no `beforeEach`/`afterEach`
- **VRT:** screenshot baselines in `src/__screenshots__/`

See `docs/testing-strategy.md` for full testing philosophy.

## Gotchas

- **Never import between features.** `editor` must not import from `slides` or `presentation`. Lint enforces this — don't waste a cycle.
- **Never import from `vite` or `vitest`.** Always `vite-plus` and `vite-plus/test`.
- **No Pinia/Vuex/Vue Router.** State is refs + provide/inject. Don't add state libraries.
- **No Node tests.** All tests must be `*.browser.test.ts` rendering `App.vue`.
- **No env variables.** All config is frontmatter-driven or UI-driven.
- **No SSR, no global Vue plugins.** Client-only SPA.
- **Use `shallowRef` for heavy objects.** `ref(editorView)` deep-proxies CodeMirror internals and breaks.
- **Dual linting is intentional.** oxlint handles JS/TS + custom boundary rules. ESLint handles Vue template rules only. Don't consolidate. See `docs/vue-dual-linting-setup.md`.
- **Cached tasks don't restore files.** `vp run ci` replays terminal output, not build artifacts. Use `--no-cache` after deleting `dist/`.

## Stack

- **Framework:** Vue 3.5, TypeScript 5.9 (strict)
- **Build:** Vite+ (`vp` CLI)
- **Parsing:** `@slidev/parser` for Slidev markdown
- **Editor:** CodeMirror 6 (markdown mode)
- **Highlighting:** Shiki (JS regex engine) — vitesse-dark/light themes
- **Math:** KaTeX (block + inline)
- **Diagrams:** Mermaid, PlantUML (via plantuml.com)
- **Composables:** `@vueuse/core`
- **Sharing:** LZ-string (URL hash compression)
- **CSS:** UnoCSS (Wind3 preset), OKLCH tokens
- **Linting:** oxlint (custom plugin) + ESLint (Vue templates)

## Project Map

```
src/
  app/                    # Composition root (App.vue, main.ts)
  features/
    editor/               # CodeMirror editing, config panel, frontmatter
    presentation/         # Fullscreen mode, navigation, speaker notes
    slides/               # Parsing, rendering, code blocks, clicks
  components/             # Shared: SlideSurface, SlidePreview, SlideLayoutHost
  composables/            # Shared: useTheme, useSlideScale, useUrlSync, etc.
  config/                 # Constants, injection keys, default content
  types/                  # Shared types (RenderedSlide, SlideSlotMap)
  utils/                  # string-utils, renderer
  styles/                 # theme-tokens.css, slidev-vars.css, transitions
  lint/                   # Custom oxlint rules (feature-boundaries, no-else)
  test-utils/             # DeckBuilder, page objects, browser test helpers
  test-fixtures/          # Fixture data for tests
  __screenshots__/        # VRT baseline screenshots
docs/                     # Deep-dive documentation (see Further Reading)
```

## Slidev Source Code

The full Slidev source code is available locally at
`/Users/alexanderopalic/Projects/opensource/slidev/`. When implementing
new features, **read the original Slidev source first** to understand how
the upstream project handles the same functionality. Key packages:

- `packages/parser/` — Markdown slide parsing (`@slidev/parser`)
- `packages/client/` — Client-side rendering, navigation, clicks, layouts
- `packages/slidev/` — Core CLI and build pipeline
- `packages/types/` — Shared TypeScript types
- `packages/playground/` — Official Slidev playground (compare with ours)

## Further Reading

**Before starting any task, identify which docs below are relevant and
read them first.**

- `docs/slidev-markdown-spec.md` — Full Slidev syntax reference. Read before touching slide parsing or rendering.
- `docs/starter-template-features.md` — Implementation status of upstream Slidev features. Read to check what's done vs. skipped.
- `docs/testing-strategy.md` — Testing philosophy and patterns. Read before writing any test.
- `docs/vue-dual-linting-setup.md` — Dual linting architecture. Read before changing lint configuration.
- `docs/vite-task-caching.md` — Task caching behavior. Read before modifying `vp run` tasks.

---

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, but it invokes Vite through `vp dev` and `vp build`.

## Vite+ Workflow

`vp` is a global binary that handles the full development lifecycle. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

### Start

- create - Create a new project from a template
- migrate - Migrate an existing project to Vite+
- config - Configure hooks and agent integration
- staged - Run linters on staged files
- install (`i`) - Install dependencies
- env - Manage Node.js versions

### Develop

- dev - Run the development server
- check - Run format, lint, and TypeScript type checks
- lint - Lint code
- fmt - Format code
- test - Run tests

### Execute

- run - Run monorepo tasks
- exec - Execute a command from local `node_modules/.bin`
- dlx - Execute a package binary without installing it as a dependency
- cache - Manage the task cache

### Build

- build - Build for production
- pack - Build libraries
- preview - Preview production build

### Manage Dependencies

Vite+ automatically detects and wraps the underlying package manager such as pnpm, npm, or Yarn through the `packageManager` field in `package.json` or package manager-specific lockfiles.

- add - Add packages to dependencies
- remove (`rm`, `un`, `uninstall`) - Remove packages from dependencies
- update (`up`) - Update packages to latest versions
- dedupe - Deduplicate dependencies
- outdated - Check for outdated packages
- list (`ls`) - List installed packages
- why (`explain`) - Show why a package is installed
- info (`view`, `show`) - View package information from the registry
- link (`ln`) / unlink - Manage local package links
- pm - Forward a command to the package manager

### Maintain

- upgrade - Update `vp` itself to the latest version

These commands map to their corresponding tools. For example, `vp dev --port 3000` runs Vite's dev server and works the same as Vite. `vp test` runs JavaScript tests through the bundled Vitest. The version of all tools can be checked using `vp --version`. This is useful when researching documentation, features, and bugs.

## Common Pitfalls

- **Using the package manager directly:** Do not use pnpm, npm, or Yarn directly. Vite+ can handle all package manager operations.
- **Always use Vite commands to run tools:** Don't attempt to run `vp vitest` or `vp oxlint`. They do not exist. Use `vp test` and `vp lint` instead.
- **Running scripts:** Vite+ built-in commands (`vp dev`, `vp build`, `vp test`, etc.) always run the Vite+ built-in tool, not any `package.json` script of the same name. To run a custom script that shares a name with a built-in command, use `vp run <script>`. For example, if you have a custom `dev` script that runs multiple services concurrently, run it with `vp run dev`, not `vp dev` (which always starts Vite's dev server).
- **Do not install Vitest, Oxlint, Oxfmt, or tsdown directly:** Vite+ wraps these tools. They must not be installed directly. You cannot upgrade these tools by installing their latest versions. Always use Vite+ commands.
- **Use Vite+ wrappers for one-off binaries:** Use `vp dlx` instead of package-manager-specific `dlx`/`npx` commands.
- **Import JavaScript modules from `vite-plus`:** Instead of importing from `vite` or `vitest`, all modules should be imported from the project's `vite-plus` dependency. For example, `import { defineConfig } from 'vite-plus';` or `import { expect, test, vi } from 'vite-plus/test';`. You must not install `vitest` to import test utilities.
- **Type-Aware Linting:** There is no need to install `oxlint-tsgolint`, `vp lint --type-aware` works out of the box.

## CI Integration

For GitHub Actions, consider using [`voidzero-dev/setup-vp`](https://github.com/voidzero-dev/setup-vp) to replace separate `actions/setup-node`, package-manager setup, cache, and install steps with a single action.

```yaml
- uses: voidzero-dev/setup-vp@v1
  with:
    cache: true
- run: vp check
- run: vp test
```

## Review Checklist for Agents

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to validate changes.
<!--VITE PLUS END-->
