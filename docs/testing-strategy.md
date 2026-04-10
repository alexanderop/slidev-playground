# Testing Strategy

This document explains the testing philosophy and setup for this project.

## Philosophy

### App-First Browser Testing

Browser tests should render the real application through `App.vue` and verify
flows the way a user experiences them: editing slides, checking preview output,
presenting, navigating, opening notes/overview, and sharing the deck.

If a browser test only mounts a leaf component, it should be treated as an
exception. The default assumption is that browser mode exists to validate the
entire app shell working together.

### Keep Pure Logic Pure

Extract logic into composables so it can still be tested as plain functions in
Node when no real browser behavior is involved. Node tests remain the fast path
for transformations, helpers, and composables that do not need the full app.

### The Testing Pyramid (Inverted)

We follow an inverted testing pyramid:

| Layer                           | Share | What it covers                         |
| ------------------------------- | ----- | -------------------------------------- |
| **Integration tests** (browser) | ~70%  | User flows rendered in a real browser  |
| **Unit tests** (Node)           | ~20%  | Pure composable/function logic         |
| **A11y / visual tests**         | ~10%  | Accessibility audits, screenshot diffs |

Integration tests form the bulk because Vitest browser mode makes them fast and
reliable. They should render the whole app, click real buttons, use keyboard
shortcuts, and assert on what the user actually sees.

### Mocking Rules

The less you mock, the more your tests are worth. Mock only what you cannot
control:

- External APIs / network calls (use MSW)
- System boundaries (time, randomness)
- Paid third-party services

Never mock your own code to make tests easier. If something is hard to test
without internal mocks, refactor the code instead.

### Factories Over Copy-Paste

Use factory functions to create test data. Define sensible defaults once and
override only what matters for a given test:

```ts
const defaultSlide: SlideInfo = { totalClicks: 0 }

function createSlide(overrides: Partial<SlideInfo> = {}): SlideInfo {
  return { ...defaultSlide, ...overrides }
}

// Usage
const slide = createSlide({ totalClicks: 3, transition: 'fade' })
```

This keeps tests focused on intent and makes schema changes a one-line fix.

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

### Configure Test Projects

The two test projects are defined in `vite.config.ts` under the `test` key.
Node runs `*.test.ts` files; browser runs `*.browser.test.ts` files via
Playwright/Chromium. See the config section below for details.

## Two Test Projects

Vitest is configured with two separate projects in `vite.config.ts`:

| Project     | File pattern               | Environment           | Use case                                   |
| ----------- | -------------------------- | --------------------- | ------------------------------------------ |
| **unit**    | `src/**/*.test.ts`         | Node                  | Pure logic that doesn't touch the DOM      |
| **browser** | `src/**/*.browser.test.ts` | Chromium (Playwright) | Tests that need a real browser environment |

Both projects run together via `vp test`.

## When to Use Which Environment

### Node (unit tests — `*.test.ts`)

Use Node for anything that doesn't require browser APIs. These tests start
instantly with zero setup overhead.

Good candidates:

- Composable logic (refs, computed, watchers) — e.g. `usePresentation.test.ts`
- Pure functions and helpers — e.g. `useScrollSync.test.ts`
- Data transformations, parsers, formatters

Example (`useScrollSync.test.ts`):

```ts
import { describe, expect, it } from 'vite-plus/test'
import { getScrollableHeight } from './useScrollSync'

describe('useScrollSync helpers', () => {
  it('calculates scrollable height', () => {
    expect(getScrollableHeight({ clientHeight: 250, scrollHeight: 1000 })).toBe(750)
  })
})
```

### Browser (browser tests — `*.browser.test.ts`)

Use the browser project for full-app user scenarios that need real DOM APIs,
browser behavior, and actual component integration through `App.vue`.

Good candidates:

- App loads markdown from `window.location.hash`
- Editing the real CodeMirror editor updates preview output
- Presentation mode responds to buttons and keyboard shortcuts
- Share flow uses `navigator.share` or clipboard fallback
- Theme/frontmatter changes affect the rendered shell

Example (`App.browser.test.ts`):

```ts
import { describe, expect, it } from 'vite-plus/test'
import { renderApp, settleApp } from './test-utils/app-browser'

it('Given a shared hash When the app loads Then it renders the deck in preview', async () => {
  using app = renderApp({ markdown: '# Intro\n\n---\n\n# Final' })
  await settleApp()
  await expect.element(app.screen.getByText('2 slides')).toBeVisible()
  await expect.element(app.screen.getByText('Intro')).toBeVisible()
})
```

### Writing Browser Scenarios

Write browser tests in `Given / When / Then` style inside Vitest `it(...)`
blocks. Keep them in TypeScript; do not add `.feature` files or a Gherkin
runner unless there is a strong reason to change the toolchain.

Prefer high-level helpers such as `renderApp()` and scenario actions over
directly wiring component props.

### Exception Cases

Allow isolated browser tests only when mounting `App.vue` adds no value or the
assertion would become unreasonable, for example:

- Verifying a browser-only primitive in total isolation
- Reproducing a very narrow DOM edge case
- Debugging a third-party browser integration that is hard to exercise through
  the full app

If the behavior matters to users and can be reached through the app, prefer an
`App.vue` scenario.

## Naming Convention

The file suffix determines which project runs the test:

- `foo.test.ts` → runs in **Node** (unit project)
- `foo.browser.test.ts` → runs in **browser** (browser project)

When adding a new test file, pick the suffix based on whether you need browser
APIs. Default to `.test.ts` (Node) unless the test genuinely requires a browser.

## Imports

Always import test utilities from `vite-plus/test`, not directly from `vitest`:

```ts
import { describe, expect, it } from 'vite-plus/test'
```

## Coverage

V8 coverage is collected across both projects for all `src/**/*.ts` files,
excluding test files and entry points (`env.d.ts`, `main.ts`).

Run `vp test` to execute all tests. Coverage reports are written to `coverage/`.
