# System Architecture

This document holds project-specific architecture detail that is useful during
implementation but too large to preload in `CLAUDE.md`.

## Layers

Dependency flow is enforced as:

```text
shared -> features -> app
```

- Shared layer: `types/`, `utils/`, `config/`, `styles/`, `composables/`,
  `components/`, `lint/`
- Features: `features/editor/`, `features/presentation/`, `features/slides/`
- App layer: `app/` only

Custom oxlint rules in `src/lint/feature-boundaries.js` enforce:

- `no-cross-feature-import`
- `unidirectional-flow`

`App.vue` is the only composition root. Features must not import each other.

## Feature Responsibilities

- `editor`: CodeMirror editing, config panel, frontmatter editing, scroll sync
- `presentation`: fullscreen mode, click animation, keyboard navigation, goto,
  overview, speaker notes
- `slides`: markdown parsing, render pipeline, code blocks, click processing,
  diagrams, compiled slide templates

Important composables/components:

- `editor`: `useCodeMirror`, `useFrontmatterEditor`, `useScrollSync`
- `presentation`: `usePresentation`, `useClickAnimation`
- `slides`: mostly pure rendering functions rather than composables

## State Model

There is no Pinia, Vuex, or Vue Router. Shared state is composed with
`ref`/`computed` and `provide`/`inject`.

Injection keys in `src/config/injection-keys.ts`:

- `slideDimensionsKey` -> computed slide width and height
- `markdownKey` -> current markdown source
- `componentFilesKey` -> local component file contents by path
- `presentationClickKey` -> active click step in presentation mode
- `runtimeColorSchemaKey` -> `'light' | 'dark' | 'auto'`
- `slidevNavKey` -> `{ next, prev, nextSlide, prevSlide, goToSlide }`
- `currentSlideIndexKey`, `totalSlidesKey`, `effectiveModeKey` -> presentation
  and theme state

Important constants in `src/config/constants.ts`:

- `SLIDE_WIDTH = 960`
- `SLIDE_HEIGHT = 540`
- `DEBOUNCE_URL_MS = 1000`
- `SPLIT_MIN_PERCENT = 20`
- `SPLIT_MAX_PERCENT = 80`
- `PREVIEW_PADDING = 48`
- `SLIDE_NUMBER_WIDTH = 32`

Persistence uses URL-hash sync with LZ-string compression.

## Render Pipeline

Slide rendering lives in `src/features/slides/render.ts`.

High-level flow:

1. Parse markdown with `@slidev/parser`.
2. Resolve imported slides from `src:` references.
3. Render markdown with markdown-it plus custom fence handling.
4. Process click directives such as `v-click`, `v-after`, and `v-clicks`.
5. Extract and scope per-slide styles.
6. Split named slide slots.
7. Compile slide templates with the registered runtime Vue components.

Read `docs/slidev-markdown-spec.md` before changing parsing or render behavior.
Read the upstream Slidev source before implementing compatibility work.

## UI and Theming

The UI theme is OKLCH-based and generated from runtime CSS variables.

- `src/styles/theme-tokens.css` defines shell tokens
- `src/styles/slidev-vars.css` defines slide-content tokens
- `useTheme` applies CSS custom properties to `document.documentElement`
- dark mode is class-based
- component styles should stay scoped to avoid global leakage

## Component and Testing Conventions

Component conventions:

- Use `<script setup lang="ts">`
- Prefer type-based `defineProps` and typed `defineEmits`
- Use `shallowRef` for heavy objects
- Prevent feedback loops in bidirectional sync code with explicit guards
- Keep frontmatter edits surgical to preserve formatting and comments

Testing conventions:

- Browser tests only, no Node unit tests
- Test files use `*.browser.test.ts`
- Tests render the real `App.vue`
- Prefer `AppPage`, `PresentationPage`, and related page objects
- Use the deck builder for markdown setup
- Cleanup uses `using` and `Symbol.dispose`

Read `docs/testing-strategy.md` before adding or changing tests.

## Project Map

```text
src/
  app/
  features/
    editor/
    presentation/
    slides/
  components/
  composables/
  config/
  styles/
  types/
  utils/
  lint/
  test-utils/
  test-fixtures/
  __screenshots__/
docs/
```
