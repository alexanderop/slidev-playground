# Starter Template Feature Support

What the playground supports versus the official Slidev starter template
(`sli.dev/new`).

## Supported Features

| Feature                             | Implementation                                                             |
| ----------------------------------- | -------------------------------------------------------------------------- |
| PlantUML diagrams (` ```plantuml`)  | `SlidevPlantUmlBlock.vue` via plantuml.com                                 |
| Iconify icons (`<carbon:foo />`)    | `SlidevIcon.vue` + `transformIconTags()` in `render.ts`                    |
| `<Arrow>`, `<Youtube>`              | `SlidevArrow.vue`, `SlidevYoutube.vue`                                     |
| `<PoweredBySlidev>`                 | `SlidevPoweredBy.vue`                                                      |
| Tabbed `<CodeGroup>` of code fences | `SlidevCodeGroup.vue` + `preprocessCodeGroups()` in `render.ts`            |
| `$slidev.nav` context in templates  | `slidevNavKey` provided in `App.vue`, injected in `compileSlideTemplate()` |
| Block math with click steps         | `katex-plugin.ts` + `SlidevKatexBlock.vue`                                 |
| Shiki Magic Move                    | `SlidevMagicMove.vue` + `preprocessMagicMove()` in `render.ts`             |
| Click-synced speaker notes          | `SpeakerNotes.vue` parses `[click]` / `[click:N]` markers                  |
| `v-mark` directive (rough-notation) | `SlidevMark.vue` (uses `@slidev/rough-notation`)                           |
| AutoFitText                         | `SlidevAutoFitText.vue` (PowerPoint-style auto-shrink)                     |
| Mermaid diagrams                    | `SlidevMermaidBlock.vue`                                                   |

All `Slidev*.vue` components live under `src/features/slides/components/` and
are registered in `compileSlideTemplate()` inside
`src/features/slides/render.ts`.

## Render Pipeline Order

`src/features/slides/render.ts` runs transforms in this order:

1. `preprocessMagicMove()` — extract 4-backtick magic-move blocks
2. `preprocessCodeGroups()` — extract `<CodeGroup>` blocks
3. `md.render()` — markdown-it processes fences, katex, headings
4. `transformIconTags()` — regex replace icon shorthand tags
5. `processClicks()` — convert `v-click`/`v-after`/`v-clicks` to data attributes
6. `compileSlideTemplate()` — Vue compile with all registered components

`katexResult.mathClicks` is collected during step 3 and folded into the total
click count.

## Intentionally Skipped

| Feature                    | Reason                                                                             |
| -------------------------- | ---------------------------------------------------------------------------------- |
| `<script setup>` in slides | Requires full Vue SFC compilation — defining boundary of playground vs real Slidev |
| Monaco Editor (`{monaco}`) | ~4 MB dependency, too heavy                                                        |
| `v-motion` directive       | Heavy dependency (`@vueuse/motion`) + complex click integration                    |
| `v-drag` / `v-drag-arrow`  | Authoring feature, not rendering                                                   |
| `<Toc>` component          | Requires cross-slide analysis at render time                                       |
| `<Tweet>` component        | Requires Twitter widget API with external scripts                                  |
| `<Counter>` component      | User-defined component, not a Slidev built-in                                      |
| TwoSlash type hovers       | ~3 MB TypeScript bundle; deferred                                                  |
