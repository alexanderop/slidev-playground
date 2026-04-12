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
- Tests are browser-only `*.browser.test.ts` files that render the real `App.vue`.
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

Before starting any task, identify which docs are relevant and read them first.
Load domain-specific docs before making changes, not after getting stuck.

- `docs/system-architecture.md` - architecture, state flow, render pipeline, theming
- `docs/url-state-and-sharing.md` - URL hash format, sharing flow, legacy compatibility
- `docs/custom-components.md` - component file model, parsing, compilation, styling, failure modes
- `docs/presentation-behavior.md` - shortcuts, dialog behavior, click vs slide navigation
- `docs/frontmatter-support.md` - supported frontmatter keys and config-panel mapping
- `docs/theme-system.md` - runtime theme variables, color mode, contrast, extension points
- `docs/slide-gotchas.md` - recurring repo-specific pitfalls worth checking before tricky changes
- `docs/slidev-markdown-spec.md` - Slidev syntax and parser behavior
- `docs/starter-template-features.md` - implemented upstream features and intentional gaps
- `docs/testing-strategy.md` - browser testing patterns, page objects, deck builder
- `docs/vue-dual-linting-setup.md` - why dual linting exists and how it is wired
- `docs/vite-task-caching.md` - task cache behavior and `vp run` caveats
