# Slidev Playground

Browser-based Slidev presentation editor with live preview. Edit Slidev markdown
in CodeMirror 6, render slides in real time, and present in fullscreen with
click animations. State lives in the URL hash. There is no backend, database,
SSR, or global plugin layer.

## Commands

```bash
vp dev        # Start dev server
vp run check  # Format + lint + typecheck
vp test       # Run browser tests
vp build      # Build for production
```

Run `vp run check` after code changes.

## Always True

- Respect the enforced dependency flow: `shared -> features -> app`.
- Never import between features. `app/` is the composition root.
- Use `vite-plus` and `vite-plus/test`, never `vite` or `vitest`.
- Do not add Pinia, Vuex, Vue Router, SSR, env-variable config, or global Vue plugins.
- Use `shallowRef` for heavy runtime objects such as CodeMirror views and Shiki instances.
- Default tests are browser `*.browser.test.ts` files that render the real `App.vue`. Pure helpers may use Node `*.test.ts`.
- Prefer page objects and the deck builder for tests. Read the testing guide before writing tests.
- When implementing Slidev behavior, read the local upstream source first:
  `/Users/alexanderopalic/Projects/opensource/slidev/`

## Project Shape

- `src/app/` - composition root
- `src/features/editor/` - editing, config panel, frontmatter, scroll sync
- `src/features/presentation/` - fullscreen, navigation, click animation, notes
- `src/features/slides/` - parsing, rendering, code blocks, clicks, diagrams
- `src/components/`, `src/composables/`, `src/config/`, `src/styles/`, `src/types/`, `src/utils/` - shared layer

## Further Reading

Before starting any task, identify which notes are relevant and read them first.
Load domain-specific notes before making changes, not after getting stuck.

- `UBIQUITOUS_LANGUAGE.md` — canonical domain vocabulary; use these terms exactly in code, comments, and docs
- `brain/codebase.md` — index of project-specific docs (architecture, render pipeline, URL state, theme, testing, gotchas)
- `brain/principles.md` — engineering principles to apply across tasks

# Brain

The `brain/` directory is an Obsidian vault — persistent memory across sessions.
It holds principles, project-specific codebase knowledge (`brain/codebase/`),
and plans.

- **Read first.** Start at `brain/index.md`, then follow wikilinks into the
  relevant section before acting.
- **Write** after mistakes, corrections, or notable codebase learnings.
- **Structure:** One topic per file. Directories with `[[wikilink]]` indexes — no inlined content.
- **Maintain:** Delete outdated notes and stale artifacts.

## Reference repositories

Source-of-truth code for libraries we depend on. Treat as **read-only reference material** — do not edit files under `repos/`. When asked about a library listed below, explore its source here first instead of guessing or relying on training data.

- `repos/repl/` — https://github.com/vuejs/repl @ main (squashed)
