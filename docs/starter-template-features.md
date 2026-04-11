# Starter Template Feature Support

Status: **In progress** (2026-04-11)

## Goal

Close the gap between our Slidev Playground and the features used in the
official Slidev starter template (`sli.dev/new`).

## What Was Implemented

### Phase 1: Quick Wins

#### 1.1 PlantUML Diagrams

- `src/components/SlidevPlantUmlBlock.vue` �� renders via plantuml.com server
- `src/slidev/render.ts` — `plantuml` fence case in `renderFence()`
- Dependency: `plantuml-encoder`

#### 1.2 Iconify Icons (`<carbon:arrow-right />`)

- `src/components/SlidevIcon.vue` — fetches SVGs from Iconify API, in-memory cache
- `src/slidev/render.ts` — `transformIconTags()` regex converts `<collection:name />` → `<SlidevIcon>`
- CSS in `src/styles/slidev-layouts.css` (`.slidev-icon`)

#### 1.3 Built-in Components

- `src/components/SlidevArrow.vue` — SVG arrow (`x1,y1,x2,y2,color,width`)
- `src/components/SlidevYoutube.vue` — iframe embed (`id` prop)
- `src/components/SlidevPoweredBy.vue` — "Powered by Slidev" link
- Registered as `Arrow`, `Youtube`, `PoweredBySlidev` in `compileSlideTemplate()`

#### 1.3.1 CodeGroup (Tabbed Code Blocks)

- `src/features/slides/components/SlidevCodeGroup.vue` — tabbed container that discovers child `SlidevCodeBlock` elements via `data-title` attribute, renders tab bar, toggles active block via CSS class
- `src/features/slides/components/SlidevCodeBlock.vue` — added `data-title` attribute to root div for CodeGroup discovery
- Registered as `CodeGroup` in `compileSlideTemplate()`
- CSS in `src/styles/slidev-layouts.css` (`.slidev-code-group-*`)
- Usage: wrap code fences with `<CodeGroup>` tags; each fence must have a `[filename]` bracket

#### 1.4 `$slidev.nav` Context

- `src/injection-keys.ts` — added `SlidevNav` interface and `slidevNavKey`
- `src/App.vue` — provides nav functions (`next`, `prev`, `nextSlide`, `prevSlide`, `goToSlide`)
- `src/slidev/render.ts` — `compileSlideTemplate()` `setup()` injects nav and returns `$slidev.nav`
- Enables `@click="$slidev.nav.next"` in slide templates

### Phase 2: Medium Effort

#### 2.1 Block Math with Click Steps (`$$ {1|3|all}`)

- `src/slidev/katex-plugin.ts` — custom markdown-it KaTeX plugin replacing
  `@traptitech/markdown-it-katex`. Parses `{range|range|...}` info from `$$` blocks,
  renders KaTeX HTML, wraps in `<SlidevKatexBlock>` with ranges prop.
- `src/components/SlidevKatexBlock.vue` — on each click, queries KaTeX DOM for
  equation rows (`.mtable > [class*=col-align] > .vlist-t > .vlist-r > .vlist > span > .mord`)
  and toggles `highlighted`/`dishonored` classes.
- Math clicks feed into `totalClicks` via `katexResult.mathClicks`.

#### 2.2 Shiki Magic Move

- `src/components/SlidevMagicMove.vue` — wraps `ShikiMagicMove` from `shiki-magic-move/vue`,
  advances code steps based on `presentationClickKey` injection.
- `src/slidev/render.ts` — `preprocessMagicMove()` runs before `md.render()`.
  Detects `````md magic-move` (4+ backtick fences), extracts inner code blocks,
  replaces with `<SlidevMagicMove steps="..." lang="...">`.
- Dependency: `shiki-magic-move` (peer dep warning on shiki v4 is harmless —
  it only uses `highlighter.codeToTokens()` which exists in v4).

#### 2.3 Click-synced Speaker Notes

- `src/components/SpeakerNotes.vue` — parses `[click]` and `[click:N]` markers,
  splits note HTML into segments, shows segments up to current click.
- `src/components/PresentationOverlay.vue` — passes `currentClick` prop to `SpeakerNotes`.

### Phase 3: Default Content Update

- `src/default-content.ts` — 12-slide deck showcasing all new features:
  icons, `$slidev.nav.next`, `<v-clicks>`, click-synced notes, two-cols layout,
  code highlight steps, magic move, scoped styles, math click steps,
  mermaid + plantuml diagrams, `<Youtube>` + `<Arrow>`, `<PoweredBySlidev>`.

## Architecture Notes

All new components are registered in `compileSlideTemplate()` in `render.ts`
(lines 126–137). Since we use Vue's `compile()` + `defineComponent()`, any
component registered in the `components` option is available in slide templates.
The `setup()` function on the compiled component injects `slidevNavKey` and
returns `$slidev` for use in template expressions.

The rendering pipeline order is:

1. `preprocessMagicMove()` — extract 4-backtick magic-move blocks
2. `md.render()` — markdown-it processes fences, katex, headings
3. `katexResult.mathClicks` — collected during katex block rendering
4. `transformIconTags()` — regex replace icon shorthand tags
5. `processClicks()` — convert v-click/v-after/v-clicks to data attributes
6. `compileSlideTemplate()` — Vue compile with all registered components

## What Was Intentionally Skipped

| Feature                    | Reason                                                                             |
| -------------------------- | ---------------------------------------------------------------------------------- |
| `<script setup>` in slides | Requires full Vue SFC compilation — defining boundary of playground vs real Slidev |
| Monaco Editor (`{monaco}`) | ~4 MB dependency, too heavy                                                        |
| `v-motion` directive       | Heavy dependency (`@vueuse/motion`) + complex click integration                    |
| `v-drag` / `v-drag-arrow`  | Authoring feature, not rendering                                                   |
| `v-mark` directive         | Needs `rough-notation` library; deferred                                           |
| `<Toc>` component          | Requires cross-slide analysis at render time                                       |
| `<Tweet>` component        | Requires Twitter widget API with external scripts                                  |
| `<Counter>` component      | User-defined component, not a Slidev built-in                                      |
| TwoSlash type hovers       | ~3 MB TypeScript bundle; deferred to future phase                                  |

## Files Changed (summary)

**New files:**

- `src/components/SlidevPlantUmlBlock.vue`
- `src/components/SlidevIcon.vue`
- `src/components/SlidevArrow.vue`
- `src/components/SlidevYoutube.vue`
- `src/components/SlidevPoweredBy.vue`
- `src/components/SlidevKatexBlock.vue`
- `src/components/SlidevMagicMove.vue`
- `src/slidev/katex-plugin.ts`

**Modified files:**

- `src/slidev/render.ts` — component registration, PlantUML fence, icon transform,
  magic-move preprocessing, KaTeX plugin swap, `$slidev.nav` setup
- `src/injection-keys.ts` — `SlidevNav` interface + `slidevNavKey`
- `src/App.vue` — provides `slidevNavKey`
- `src/components/SpeakerNotes.vue` — click-synced note segments
- `src/components/PresentationOverlay.vue` — passes `currentClick` to SpeakerNotes
- `src/styles/slidev-layouts.css` — `.slidev-icon`, `.slidev-plantuml-block` styles
- `src/default-content.ts` — new 12-slide showcase deck

**New dependencies:**

- `plantuml-encoder` (1.4.0)
- `shiki-magic-move` (1.3.0)

#### AutoFitText Component

- `src/features/slides/components/SlidevAutoFitText.vue` -- auto-resizes text
  to fit its container, like PowerPoint's auto-shrink text box. Uses
  `useElementSize` from `@vueuse/core` to observe container and content widths,
  dynamically computes font size clamped between `min` (default 30) and `max`
  (default 100) props. Enables text wrapping when content is too wide at minimum
  size.
- Registered as `AutoFitText` in `compileSlideTemplate()`.
- Usage: `<AutoFitText :max="80" :min="20">Long text here</AutoFitText>`

## What To Do Next

- Verify each feature visually in the browser (dev server on port 5173)
- Test magic move animation in presentation mode (click through steps)
- Test PlantUML rendering (requires internet for plantuml.com)
- Test icon loading (requires internet for api.iconify.design)
- Test `$slidev.nav.next` click handler on the cover slide
- Test math click steps in presentation mode
- Test click-synced speaker notes (press N to show notes, then advance clicks)
- Consider adding `v-mark` directive (rough-notation) as a follow-up
- Consider adding TwoSlash support behind a lazy-load gate
