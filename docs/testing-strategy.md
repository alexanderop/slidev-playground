# Testing Strategy

This document explains the testing philosophy and setup for this project.

## Philosophy

### Browser-First, App-First Testing

Default: tests run in Vitest browser mode (Playwright/Chromium) and render the
real `App.vue`. Every such test exercises the app the way a user experiences
it: editing slides, checking preview output, presenting, navigating, opening
notes/overview, and sharing the deck.

Exception — pure helpers with no DOM or Vue dependency may run as Node unit
tests. The test split is driven entirely by filename:

- `*.browser.test.ts` runs in the `browser` project (Playwright/Chromium).
- `*.test.ts` runs in the `node` project (Node environment, no DOM).

The projects are declared in `vite.config.ts` under `test.projects`. Put a test
in the node project only when the subject is framework-free (string utils,
parsers, pure functions). Anything that touches Vue, the DOM, or a composable's
reactive surface belongs in the browser project.

### Flat Tests, No Hooks

Tests are flat — no `describe` nesting, no `beforeEach`/`afterEach`. File names
serve as grouping (`deck-loading.browser.test.ts`, `share-flow.browser.test.ts`).

All cleanup is handled by **disposable objects** via `Symbol.dispose`. The
`using` keyword guarantees cleanup runs even when assertions throw — no leaked
state between tests, no hidden `afterEach` in a setup file.

```ts
// Cleanup happens automatically when `app` goes out of scope
using app = await AppPage.render({ markdown: MY_DECK })
```

This follows the principle from [Better Test Setup with Disposable Objects](https://www.epicweb.dev/better-test-setup-with-disposable-objects):
collocate setup and cleanup in one place, keep test cases self-contained.

### Mocking Rules

The less you mock, the more your tests are worth. Mock only what you cannot
control:

- Browser APIs that need deterministic behavior (`navigator.share`,
  `navigator.clipboard`, `document.exitFullscreen`)
- System boundaries (time, randomness)

Never mock your own code to make tests easier. If something is hard to test
without internal mocks, refactor the code instead.

### Prefer `getByRole` Over Test IDs

When querying the DOM in browser tests, prefer accessible locators
(`getByRole`, `getByText`) over `getByTestId`. If a test can't find an element
by role, that's a signal the UI has an accessibility problem — fix the
component, not the test.

## Setup

### Install Dependencies

```bash
vp add -D @vitest/browser-playwright @vitest/coverage-v8 playwright vitest-browser-vue
```

### Configure Tests

Tests are configured as a single browser project in `vite.config.ts` under the
`test` key. All `*.browser.test.ts` files run in Chromium via Playwright.
There is no global setup file — cleanup lives inside the disposable objects.

## Writing a New Test

### 1. Build a deck with the deck builder

Use the `deck()` factory from `src/test-utils/deck-builder.ts` to compose test
markdown instead of writing raw Slidev markdown by hand:

```ts
import { deck } from './test-utils/deck-builder'

const MY_DECK = deck()
  .title('My test')
  .fonts({ sans: 'Inter' })
  .theme('#ff0000')
  .slide('First slide', (s) => s.text('Hello world').click('Revealed on click'))
  .slide('Code slide', (s) =>
    s.code('const x = 1\nconst y = 2', {
      lang: 'ts',
      filename: 'example.ts',
      highlights: '1-2',
    }),
  )
  .build()
```

Available slide methods:

- `.text(content)` — raw content (HTML, markdown)
- `.click(content)` — wraps in `<div v-click>`
- `.clickAfter(content)` — wraps in `<div v-after>`
- `.clicks(items)` — `<ul v-clicks>` list
- `.code(source, options?)` — fenced code block with optional filename,
  highlights, line numbers
- `.note(text)` — speaker note (`<!-- ... -->`)
- `.layout(name)` — per-slide layout
- `.import(src)` — import from external markdown
- `.iframeUrl(url)` — iframe-right layout with URL
- `.slideClass(name)` — per-slide CSS class

For shared fixtures, add them to `src/test-utils/browser-test-fixtures.ts`.

### 2. Use the AppPage page object

Use `AppPage` from `src/test-utils/page-objects/app-page.ts` for all
interactions. It provides a semantic API that matches user actions:

```ts
import { AppPage } from './test-utils/page-objects/app-page'

it('Given a deck When presenting Then navigation works', async () => {
  using app = await AppPage.render({ markdown: MY_DECK })

  // Preview assertions
  app.expectSlideCount(2)
  app.expectSlideVisible('First slide')

  // Enter presentation mode
  const presentation = await app.present()
  presentation.expectSlidePosition('1 / 2')

  // Navigate
  await presentation.next()
  await presentation.pressKey('ArrowDown')

  // Code block assertions (by index)
  await app.waitForCodeBlocks()
  const block = app.codeBlock(0)
  block.expectLineCount(2)
  block.expectHighlightedLines(['1', '2'])

  // Style settings
  const settings = await app.openStyleSettings()
  await settings.setDarkMode()
  app.expectDarkMode()
})
```

### 3. Write flat tests in Given / When / Then style

Each `it(...)` is self-contained — all setup inside, cleanup via `using`.
No `describe` blocks needed, the file name is the group:

```ts
// share-flow.browser.test.ts

it('Given native share is unavailable When the user shares Then the app falls back to clipboard', async () => {
  using app = await AppPage.render({ markdown: MY_DECK })
  await app.share()
  expect(app.clipboardSpy).toHaveBeenCalled()
})

it('Given native share is available When the user shares Then the app uses the browser share API', async () => {
  using app = await AppPage.render({ markdown: MY_DECK, nativeShare: true })
  await app.share()
  expect(app.shareSpy).toHaveBeenCalled()
})
```

### AppPage sub-objects

- `app.presentation` — returned by `app.present()`. Navigation, shortcuts,
  speaker notes, overview, goto dialog, click visibility assertions.
- `app.styleSettings` — returned by `app.openStyleSettings()`. Dark mode,
  primary color, canvas width, aspect ratio.
- `app.codeBlock(index)` — query a specific code block by its DOM index.
  Line counts, highlighted/dishonored line assertions.

## Naming Convention

Test files use one of two suffixes:

- `*.browser.test.ts` — browser project (default for anything touching Vue or
  the DOM).
- `*.test.ts` — node project (framework-free unit tests only).

No other test patterns are picked up by the vitest config.

## Imports

Always import test utilities from `vite-plus/test`, not directly from `vitest`:

```ts
import { expect, it } from 'vite-plus/test'
```

## Coverage

V8 coverage is collected for all `src/**/*.ts` and `src/**/*.vue` files,
excluding test files and entry points (`*.d.ts`, `main.ts`).

Run `vp test` to execute all tests. Coverage reports are written to `coverage/`.

## Troubleshooting

### Deck Builder Code Fence Spacing

The Slidev parser is sensitive to spacing in code fence metadata. The deck
builder produces this format:

    ```ts [filename.ts] {lines:true,startLine:5}{2-3|4}

Note:

- Space between language and `[filename]`
- Space between `[filename]` and `{options}`
- **No space** between `{options}` and `{highlights}`

If tests fail with "line not found" or code blocks don't render, check that the
fence format matches what `@slidev/parser` expects.

### Role Query Strict Mode

When a button contains a nested element with `role="button"` (e.g., a close
icon `<span role="button">`), `getByRole('button', { name: '...' })` matches
both elements, causing a strict mode violation. Use `exact: true`:

```ts
// Fails: matches both parent button and nested span
await app.screen.getByRole('button', { name: 'Remove Comp1.vue' }).click()

// Works: matches only the span with exact aria-label
await app.screen.getByRole('button', { name: 'Remove Comp1.vue', exact: true }).click()
```

### Dialog Closed Assertions

`getByRole` throws when no element matches. To assert a dialog has closed, use
`querySelector` with `toBeNull()`:

```ts
expect(app.container.querySelector('[aria-label="Goto slide"]')).toBeNull()
```

When the closed dialog lives inside a larger overlay (e.g., the goto dialog
inside presentation mode), only assert the specific dialog is gone — the
surrounding overlay may still be mounted.

### Drag Behavior via Mouse Events

Split-pane and resize handles use global window listeners. Dispatch `mousedown`
on the element, then `mousemove` and `mouseup` on `window`:

```ts
divider.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
window.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 200 }))
window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
```
