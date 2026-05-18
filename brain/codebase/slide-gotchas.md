# Slide Gotchas

This file is for non-obvious Slidev Playground behaviors that repeatedly trip up
agents or humans. Keep it short, concrete, and limited to project-specific
pitfalls.

## URL State Uses Two Formats

If there are no custom component files, the app stores a compressed markdown
string directly in the hash. If there are component files, it stores compressed
JSON with `{ m, c }`.

Do not assume all shared hashes decode to JSON. See [[url-state-and-sharing]].

## Feature Boundaries Are Enforced

Features must not import each other. Composition happens in `src/app/`.

If a change seems to require `editor -> slides` or `presentation -> editor`
imports, the design is probably wrong.

## Default Test Project Is Browser

Default: `*.browser.test.ts` rendering the real `App.vue`. The `node` project
exists for framework-free pure helpers only (e.g. `frontmatter-core.test.ts`) —
anything touching Vue, the DOM, or a reactive composable belongs in the browser
project. See [[testing-strategy]].

## Use `vite-plus`, Not `vite` or `vitest`

Imports and tooling should go through `vite-plus` and `vite-plus/test`.

## Custom Component Names Come From Filenames

`Quote.vue` registers `<Quote>` and `<quote>`. If the file is named `Comp1.vue`,
the usable tag is `Comp1`, not whatever component name you intended internally.
See [[custom-components]].

## Hash Changes Are API Changes

Shared URLs are a user-facing contract. Treat URL format changes as compatibility
changes, not internal refactors. See [[principles/treat-serialized-formats-as-public-api]].

## Notes With Click Markers Are Progressive

Speaker notes can contain `[click]` and `[click:N]` markers. Notes do not all
appear at once while presenting. See [[presentation-behavior]].

## Frontmatter Support Is Partial

Do not assume every upstream Slidev frontmatter field is implemented locally.
Check [[frontmatter-support]] and the render/runtime code first.
