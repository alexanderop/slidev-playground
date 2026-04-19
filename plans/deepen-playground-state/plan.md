# Deepen Playground State

## Problem

Three shallow modules co-own the concept of "a shareable playground state" without a coherent boundary:

- **`src/composables/useUrlSync.ts`** handles lz-string compression, zod validation of the `{m, c}` hash shape, legacy plain-markdown detection, debounced hash writes, and native-share/clipboard fallback.
- **`src/features/slides/custom-components.ts`** regex-parses `.vue` files (three `defineProps` variants), compiles templates via Vue's `compile()`, aggregates `<style>` blocks, and substitutes an error component on compile failure.
- **`src/app/useCustomComponents.ts`** is **dead code** — never imported. It was supposed to own the `<style id="slidev-custom-component-styles">` DOM tag. `App.vue` duplicates the same logic inline (App.vue:61-64 and 83-89) with a slightly different lifecycle pattern.

### Integration risk living in the seams

- **Silent failure everywhere.** Malformed hash → defaults. SFC regex miss on `defineProps` → empty props array. Compile throw → error component. None of these failures surface as data — the module behaves the same whether the user supplied a correct file or a broken one.
- **Round-trip is not a contract.** `encode(decode(hash))` idempotence is nowhere asserted. An empty `componentFiles` object flips the URL between raw-markdown (legacy) and `{m, c}` JSON shapes.
- **Style tag injection is duplicated** with divergent lifecycle semantics (App.vue inline in `onMounted`, orphan composable uses top-level `computed`).
- **Brittle SFC regex.** `<!-- <script setup> -->` inside a template matches the script regex.
- **No validation between deserialize and run.** Component files with broken SFCs get re-serialized into the URL on every keystroke.

### Existing tests giving false confidence

- `src/custom-components.browser.test.ts` asserts rendered DOM after a component compiles, and has one "shared URL with components" round-trip check — but never asserts idempotence or surfaces parse errors as data. Its "broken component" case exercises the _compile_ path, not the _parse_ path; silent empty-props on regex miss is untested.
- `src/deck-loading.browser.test.ts` loads a hash but doesn't re-encode and compare.
- `src/share-flow.browser.test.ts` exercises native-share-vs-clipboard branching but not the state it shares.

The real wiring between SFC parsing, compilation, style injection, and URL serialization is never exercised as one scenario.

## Proposed Interface

```ts
// src/app/usePlaygroundState.ts

export type PlaygroundDefaults = {
  readonly markdown: string
  readonly componentFiles: Record<string, string>
}

export type PlaygroundCompileError = {
  readonly filename: string // e.g. "Quote.vue"
  readonly componentName: string // e.g. "Quote"
  readonly phase: 'parse' | 'compile'
  readonly message: string
}

export type PlaygroundStateApi = {
  readonly markdown: Ref<string>
  readonly componentFiles: Ref<Record<string, string>>
  readonly customComponents: Readonly<Ref<Record<string, Component>>>
  readonly compileErrors: Readonly<Ref<readonly PlaygroundCompileError[]>>
  readonly share: () => Promise<void>
  readonly copied: Readonly<Ref<boolean>>
}

export function usePlaygroundState(defaults: PlaygroundDefaults): PlaygroundStateApi
```

One entry point. Explicit `defaults` argument so the composition root owns configuration. Six reactive fields; no `hydrate()`, `dispose()`, or options bag. No ports.

### Usage

`App.vue` collapses from ~30 lines of state plumbing (lines 35–90) to roughly 6:

```ts
const playground = usePlaygroundState({
  markdown: defaultContent,
  componentFiles: defaultComponentFiles,
})
provide(markdownKey, playground.markdown)
provide(componentFilesKey, playground.componentFiles)

const renderedSlides = useSlideRenderer({
  slides: resolvedSlides,
  config,
  defaults,
  customComponents: () => playground.customComponents.value,
})
```

`provide` stays in App.vue — the composition root is where injection contracts are assembled, and moving it into the composable would hide ownership.

### What the interface hides

- lz-string compression/decompression and legacy plain-markdown detection
- zod validation of the `{m, c}` hash shape
- debounced (`DEBOUNCE_URL_MS`) writes watching both refs (`componentFiles` with `{ deep: true }`)
- SFC regex parsing across three `defineProps` variants
- Vue template compilation and concatenation of `<style>` blocks
- the single `<style id="slidev-custom-component-styles">` DOM tag lifecycle, owned via `effectScope` / `onScopeDispose`
- native-share vs clipboard-copy fallback via VueUse
- mapping parse failures and compile throws to structured `PlaygroundCompileError` entries (replaces today's silent empty-props and substituted error-component-without-report)

## Dependency Strategy

**Category: In-process.** All inputs are strings; outputs are strings, `Component` objects, and reactive refs. No network, no persistent storage, no third-party services.

- Real Vue refs flow through the composable directly; `useSlideRenderer` receives `() => playground.customComponents.value` matching its existing thunk signature.
- Style tag lifecycle is scoped to the composable's `effectScope` so tests that mount/unmount the app repeatedly don't leak DOM.
- The test substitution path already exists: `AppPage.render({ markdown, componentFiles })` in `src/test-utils/app-browser.ts` seeds state via `buildEncodedHash` and mounts the real `App.vue`. The composable reads the same `window.location.hash` it reads in production, so no mocks of the module's collaborators are needed. `navigator.share` and `navigator.clipboard` are stubbed at the platform level by `AppPage`, exactly as `share-flow.browser.test.ts` does today.

No ports, no adapters. If `@vue/compiler-sfc` replaces the regex parser later, it replaces one private function; the module's public contract is unchanged.

## Testing Strategy

### New integration test to write

`src/playground-state.browser.test.ts` — one realistic test at the deepened boundary:

```ts
it('Given valid and broken components When serialized and reloaded Then state round-trips, DOM renders, broken components surface as structured errors, and the hash is idempotent', async () => {
  const md = deck()
    .title('Round trip')
    .slide('Valid', (s) => s.text('<Quote author="A">hi</Quote>'))
    .slide('Broken', (s) => s.text('<Broken />'))
    .build()

  using app = await AppPage.render({
    markdown: md,
    componentFiles: {
      'Quote.vue':
        '<script setup>defineProps(["author"])</script>\n<template><q><slot />—{{ author }}</q></template>',
      'Broken.vue': '<script setup>defineProps(["x"])</script>', // no <template>
    },
  })

  // (a) Valid component renders
  expect(app.container.querySelector('q')?.textContent).toContain('hi')
  expect(app.container.querySelector('q')?.textContent).toContain('A')

  // (b) Broken component surfaces as structured error (not silent)
  const errorBlock = app.container.querySelector('.slidev-error-block')
  expect(errorBlock).toBeTruthy()
  expect(errorBlock?.textContent).toContain('Broken')

  // (c) Style tag owned exactly once
  expect(document.querySelectorAll('#slidev-custom-component-styles').length).toBe(1)

  // (d) Hash round-trips: what we rendered from is what we'd share
  app.expectHashPresent()
  const first = app.getSharedState()
  expect(first.markdown).toBe(md)
  expect(first.componentFiles['Quote.vue']).toBeTruthy()
  expect(first.componentFiles['Broken.vue']).toBeTruthy()

  // (e) Debounced edit re-encodes; second share produces identical state
  await app.updateMarkdown(md + '\n\n---\n\n# Added')
  await waitForHashUpdate()
  const second = app.getSharedState()
  expect(second.markdown).toContain('# Added')
  expect(second.componentFiles).toEqual(first.componentFiles)
})
```

This single scenario exercises parsing, compilation, style injection, serialization, debounced writes, and error surfacing — the full seam.

### Old tests to delete

- **`src/custom-components.browser.test.ts`** — retire the 6th test (shared URL with components), the error-block test, and the style-tag assertion test; these become redundant with the integration test. Keep the two-component rendering test as a quick smoke, keep the add-component-file test (exercises the file-tab UI, not the state module).
- **`src/deck-loading.browser.test.ts`** — the first test ("hash loads full deck in preview") is subsumed by (a) and (d). Keep the markdown-update test (exercises the editor wiring, not URL sync).
- **`src/share-flow.browser.test.ts`** — keep both tests (they exercise the native-share vs clipboard platform branching, which is a distinct concern from state round-trip).

### Test environment needs

No new stand-ins. `AppPage.render({ markdown, componentFiles })`, `buildEncodedHash`, the clipboard/share spies, and the `#slidev-custom-component-styles` cleanup in `app-browser.ts` already cover everything required.

### What is intentionally not tested

- Individual `parseComponentFiles` regex branches. These are private to the module now; behavior is covered end-to-end by the integration test surfacing `compileErrors` for malformed inputs.
- `encode` / `decode` idempotence as a unit test. The integration test's (d)+(e) asserts observable round-trip through the real hash, which is the contract callers care about.
- Every combination of `defineProps` syntax. A single regression test with one valid `<script setup>` shape proves the pipeline works; if a specific syntax breaks, a new integration test at that grain is cheaper than exhaustive unit coverage.

## Implementation Recommendations

### What the module should own

- The reactive `markdown` and `componentFiles` refs, constructed internally with the supplied defaults.
- Initial hash read (synchronous in setup; no `onMounted` dance — the hash is available at setup time in this SPA).
- Debounced hash write watching both refs.
- SFC parsing and Vue template compilation, producing the compiled components map, aggregated styles, and a list of structured errors.
- The single `<style>` DOM tag: create, keep in sync via an effect scope, remove on scope disposal.
- Share action delegating to `navigator.share` when supported and falling back to clipboard copy; expose the transient `copied` flag.

### What the module should hide

- lz-string, zod, VueUse internals — callers should not need to import these to interact with playground state.
- The `{m, c}` JSON shape, legacy plain-markdown detection, and any future format migrations.
- Style-tag DOM ownership (no caller should ever touch `document.head` for component styles again).
- Silent failure paths — every parse or compile issue must emerge through `compileErrors`, never swallowed.

### What the module should expose (the contract)

- Reactive refs the caller can read, write, and `provide` to descendants.
- A read-only view of compiled components and errors.
- One async `share()` method and a read-only `copied` flag.
- That's all. No options bag, no `hydrate()`, no `dispose()`, no port injection. Self-contained.

### How callers migrate

1. Replace the inline `ref('')` + `ref({})` + `loadFromHash()` + style-tag `onMounted` block in `App.vue` (lines 35–90) with a single `usePlaygroundState(defaults)` call and two `provide` statements.
2. Update `useSlideRenderer`'s `customComponents` thunk to read `playground.customComponents.value` directly (not `.components` — the module hides the styles string).
3. Replace the local `share` / `copied` destructuring with `playground.share` / `playground.copied`.
4. Delete `src/app/useCustomComponents.ts` (dead code).
5. Delete `src/composables/useUrlSync.ts` — its behavior is absorbed.
6. Move `src/features/slides/custom-components.ts` contents into private helpers inside the new module, or keep it as a pure utility re-exported from the feature layer and consumed privately by the app-layer composable. The former is preferred since no other caller imports `parseComponentFiles` / `compileCustomComponents`.
7. Add `compileErrors` to the config panel or a small banner so users see parse failures instead of silent empty-props. (Optional but recommended — it's the main quality gain.)
