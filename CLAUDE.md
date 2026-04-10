# CLAUDE.md

Slidev Playground — browser-based presentation editor with live preview,
markdown editing (CodeMirror 6), and presentation mode. Parses Slidev
markdown syntax via @slidev/parser.

## Commands

vp dev # Start dev server
vp run check # Format + lint + typecheck (oxlint + ESLint + tsc)
vp run lint # Lint only (oxlint + ESLint)
vp run lint:vue # ESLint Vue template rules only
vp test # Run tests
vp build # Build for production

Run `vp run check` after code changes.

## Stack

- Vue 3, TypeScript (strict), Vite+ (`vp` CLI)
- @slidev/parser for markdown slide parsing
- CodeMirror 6 for editing, Shiki for syntax highlighting
- @vueuse/core for composables
- LZ-string for URL-based sharing

## Structure

- `src/App.vue` — Main component (editor + preview + presentation)
- `src/composables/` — State logic (usePresentation, useUrlSync, useCodeMirror, useSplitPane, useSlideScale, useTheme)
- `src/renderer.ts` — Markdown → HTML pipeline (markdown-it + Shiki)
- `src/click-processor.ts` — v-click animation processing
- `src/styles/` — CSS variables, themes, transitions

## Conventions

- Composition API with `<script setup>` only
- All state logic in composables (`src/composables/`)
- Import from `vite-plus` and `vite-plus/test`, not from `vite`/`vitest` directly
- Dual linting: oxlint (JS/TS) + ESLint (Vue templates only)

## Further Reading

**IMPORTANT:** Before starting any task, identify which docs below are
relevant and read them first.

- `docs/testing-strategy.md` — Testing strategy (Node unit tests vs browser tests)
- `docs/vue-dual-linting-setup.md` — Dual linting architecture (oxlint + ESLint)
- `docs/vite-task-caching.md` — How `vp run` caching works in this repo
- `AGENTS.md` — Vite+ toolchain commands and pitfalls
