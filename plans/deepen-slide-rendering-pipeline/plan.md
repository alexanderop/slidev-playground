# Deepen the slide rendering pipeline

## Problem

The slide rendering pipeline lives in `src/features/slides/render.ts` and is
already a single-entry-point module on paper (`renderSlides` + `clearComponentCache`).
In practice it leaks in three ways that block confident testing and that no
current test catches.

### 1. Module-global mutable state

Three pieces of state live at module scope:

- `compiledComponentCache: Map<string, Component>` — accumulated across calls.
- A singleton `md = new MarkdownIt(...)` with attached renderer rules.
- `katexResult = { mathClicks: 0 }` — mutated on every `renderMarkdown()` call
  (`render.ts: katexResult.mathClicks = 0`).

The exported `clearComponentCache()` exists _only_ so tests can reset state.
That's the textbook tell — it's a test escape hatch, not a domain operation.
The `katexResult.mathClicks = 0` reset before each render also means parallel
or interleaved renders would race; today only sequential rendering keeps it
correct.

### 2. Click reconciliation is opaque

Per-slide `totalClicks` is reduced from three independent sources via inline
`Math.max` calls inside the `for (const slot of slots)` loop:

- `processClicks().totalClicks` (DOM directives like `v-click`, `v-clicks`,
  `v-after`, `v-switch`).
- `renderMarkdown().codeClicks` (which itself folds magic-move steps,
  code-group fence highlight steps, and katex `mathClicks`).
- The final `Math.max(clickOffset, codeClicks)` at the bottom of `renderSlide`.

There is no named function that owns this reconciliation, no test that pins
its behaviour, and no place in the codebase that documents the rule.

### 3. The pipeline ordering and the test altitude

The 6-step pipeline is implicit:

```
splitSlideSlots → extractStyles → renderMarkdown → processClicks → scopeCSS → compileSlideTemplate
```

The order is load-bearing (`extractStyles` must precede `renderMarkdown`,
`processClicks` must follow it), but lives only in `renderSlide()`'s body.

Every behavioural test of this pipeline today goes through the full app via
`AppPage.render({ markdown })` — `click-system.browser.test.ts`,
`slide-blocks.browser.test.ts`, `code-rendering.browser.test.ts`,
`code-group.browser.test.ts`, plus pieces of `custom-components`,
`builtin-components`, `slidev-nav`, `v-mark`, and `auto-fit-text` browser
tests. That's hundreds of assertions all wrapped in editor + presentation
ceremony. When a click count is wrong, the test cannot tell whether the
rendering pipeline produced bad output or the presentation overlay misread
correct output. The seam where that distinction lives is untestable today.

There are no false-confidence unit tests on render.ts itself — the issue is
the inverse: _no_ tests target the rendering boundary directly. Coverage at
the right altitude is missing.

## Proposed Interface

A new shape exported from `src/features/slides/render.ts`:

```ts
import type { Component, ComputedRef, MaybeRefOrGetter } from 'vue'

export type RenderInputs = {
  slides: readonly ResolvedSlideSource[]
  config: SlidevConfig
  defaults: Readonly<Record<string, unknown>>
  customComponents?: Readonly<Record<string, Component>>
}

// Reactive entry point — the production path. Builds one Renderer instance
// with private state (markdown-it, katex env, compiled-template cache) per
// composable invocation. Cache is invalidated by reassigning the renderer
// when customComponents identity changes.
export function useSlideRenderer(inputs: {
  slides: MaybeRefOrGetter<readonly ResolvedSlideSource[]>
  config: MaybeRefOrGetter<SlidevConfig>
  defaults: MaybeRefOrGetter<Readonly<Record<string, unknown>>>
  customComponents?: MaybeRefOrGetter<Readonly<Record<string, Component>> | undefined>
}): ComputedRef<readonly RenderedSlide[]>

// Non-reactive entry point — used by tests and any future non-Vue caller.
export function renderSlidesOnce(inputs: RenderInputs): readonly RenderedSlide[]
```

Both share a private `createRenderer()` that allocates `md`, `katexState`,
and `componentCache` in closure scope. Inside the renderer, click counts
flow through one named function:

```ts
function reconcileSlideClicks(
  perSlot: readonly {
    directiveClicks: number
    markdownClicks: number
  }[],
): number
```

This collapses the three `Math.max` calls in today's `renderSlide` into one
visible, separately-testable rule.

The Slidev built-in component dictionary (currently a 30-line inline object
literal in `compileSlideTemplate`) moves to a sibling `builtin-components.ts`
module exporting `BUILTIN_SLIDE_COMPONENTS: Readonly<Record<string, Component>>`.
Registration becomes data, not control flow.

`renderSlides` and `clearComponentCache` are removed from the public API.

### Usage at the call site

`src/app/App.vue` lines 67–75 become:

```ts
const renderedSlides = useSlideRenderer({
  slides: resolvedSlides,
  config,
  defaults,
  customComponents: () => customComponents.value.components,
})
```

The `watch(customComponents, () => clearComponentCache())` line and the
`clearComponentCache` import are deleted.

### What complexity it hides

- Pipeline ordering and step composition.
- Click reconciliation across DOM directives, code-fence highlight steps,
  magic-move steps, and katex math.
- The MarkdownIt instance and its attached fence/heading rules.
- The katex env handoff.
- The compiled-template cache and the cache-key strategy.
- Vue compile error fallback components.
- The Slidev built-in component registry.

## Dependency Strategy

**Category: In-process + Local-substitutable.**

- `markdown-it`, `@vue/compiler`, the katex plugin, the Slidev built-in
  components, and all preprocessing logic are pure JS — merged into the
  module, no injection needed.
- `DOMParser` is browser-only but available in the existing browser-test
  runtime. The integration test runs the real pipeline against the real
  browser DOMParser. No mocks.
- Module-global state is replaced with per-instance closure state owned by
  `createRenderer()`. There is no shared cache across instances — for the
  one-consumer playground this is a non-issue.
- `customComponents` are passed through `RenderInputs`. The reactive entry
  point swaps the renderer instance when their identity changes, retiring
  the old cache as a unit.

## Testing Strategy

### New integration test to write

One test at the rendering boundary, in `src/render-pipeline.browser.test.ts`,
using `renderSlidesOnce()`. Drive it with a kitchen-sink deck that exercises
all the seam-adjacent features at once:

- Frontmatter (`theme`, `lineNumbers`).
- A slide with `<v-clicks>` over a list, plus a scoped `<style>` block.
- A slide with a `two-cols` layout, slot dividers (`::left::`, `::right::`),
  a code fence with highlight steps, and a mermaid fence.

Assert through the public interface only:

- 2 rendered slides.
- Slide 0: `totalClicks === 2`, `scopedStyles` contains the scoped selector
  `#slidev-scope-0 .slidev-markdown h1`, `layout === 'cover'`.
- Slide 1: `Object.keys(slotComponents)` is `['left', 'right']`,
  `totalClicks === 1` (from highlight step), `layout === 'two-cols'`.

This single test exercises slot splitting, style extraction + scoping,
markdown rendering, fence rendering (code + mermaid), click directive
processing, and click reconciliation — all through the real pipeline.

### Old tests to delete or shrink

Move the rendering-shape assertions out of these files (keep only the
behaviour assertions that genuinely require a mounted `App.vue`):

- `src/click-system.browser.test.ts` — keep the _interesting_ directive
  combinations (range, depth, every, switch, hide+after) as integration
  tests at `renderSlidesOnce` boundary; delete the basic counter-math cases.
- `src/slide-blocks.browser.test.ts` — slot splitting and layout assertions
  move to the new test; presentation flow stays.
- `src/code-rendering.browser.test.ts` — fence-to-component output is
  observable through `renderSlidesOnce`; UI rendering stays only where it
  exercises Shiki / DOM behaviour the renderer doesn't own.
- `src/code-group.browser.test.ts` — code-group HTML structure moves to the
  new test; tab-switching UI stays.

Leave untouched: `presentation.browser.test.ts`, `editor-*.browser.test.ts`,
`config-panel.browser.test.ts`, `share-flow.browser.test.ts`,
`deck-loading.browser.test.ts`, and `user-flows.browser.test.ts` — these
exercise app behaviour, not rendering.

### Test environment needs

None beyond what's already in place. The browser test runtime (vite-plus)
provides a real `DOMParser`. No mocks of internal collaborators.

### What is intentionally not tested

- Per-step internals of `splitSlideSlots`, `extractStyles`, `scopeCSS`,
  `processClicks`, `parseFenceInfo`. These are exercised end-to-end through
  the kitchen-sink test. If a regression slips through, add a focused
  integration test at the boundary, not a unit test on the helper.
- The `compiledComponentCache` itself. Caching is correctness-via-identity
  (same template string → same compiled component). The kitchen-sink test
  proves correctness; cache hits are a performance concern, not a contract.
- The reactive `useSlideRenderer` wrapper, beyond a smoke test that
  recomputes when `customComponents` change. The reactivity is thin; the
  pipeline correctness lives in `renderSlidesOnce`.

## Implementation Recommendations

### What the module should own

- The full markdown-to-`RenderedSlide[]` transformation, including all
  preprocessing (magic-move, code-groups, icon tags), markdown rendering,
  fence rendering, click directive processing, CSS scoping, and Vue
  template compilation.
- The lifecycle of its caches and its MarkdownIt instance — one per
  renderer instance, scoped to the composable's lifetime.
- The reconciliation rule for `totalClicks` from independent sources.
- The Slidev built-in component registry as data.

### What the module should hide

- Pipeline step ordering.
- The MarkdownIt instance and its plugins.
- The compiled-template cache and its keying.
- Click count reconciliation arithmetic.
- The DOMParser dependency.
- Compile-error fallback components.

### What it should expose

- `useSlideRenderer(...)`: the reactive composable returning
  `ComputedRef<readonly RenderedSlide[]>`.
- `renderSlidesOnce(...)`: the pure, one-shot variant for tests and any
  future non-Vue caller.
- The `RenderInputs` type.

Nothing else. No `clearComponentCache`, no `renderSlides`, no
`compileSlideTemplate`, no exported helpers.

### Migration

1. Extract `BUILTIN_SLIDE_COMPONENTS` to `src/features/slides/builtin-components.ts`.
2. Refactor the body of `render.ts` into a private `createRenderer()`
   factory holding instance-scoped `md`, `katexState`, and `componentCache`.
3. Introduce `reconcileSlideClicks(perSlot)` and replace the inline
   `Math.max` calls.
4. Add `renderSlidesOnce(inputs)` as a thin wrapper over
   `createRenderer().render(inputs)`.
5. Add `useSlideRenderer(refs)` that constructs the renderer once and
   re-constructs it via `watch` when `customComponents` identity changes;
   wraps the result in a `computed`.
6. Update `src/app/App.vue` to use `useSlideRenderer`. Delete the
   `clearComponentCache` import and the `watch(customComponents, ...)`
   line.
7. Write `src/render-pipeline.browser.test.ts` with the kitchen-sink test.
8. Delete or shrink the rendering-shape assertions from
   `click-system.browser.test.ts`, `slide-blocks.browser.test.ts`,
   `code-rendering.browser.test.ts`, `code-group.browser.test.ts`.
9. Run `vp run check` and `vp test`.

The rendering helpers in `slots.ts`, `style-extractor.ts`, `fences.ts`,
and `click-processor.ts` stay where they are — they're already correctly
scoped utility modules. The deepening happens at the orchestration layer
(`render.ts`) and at the call site, not by collapsing helpers.
