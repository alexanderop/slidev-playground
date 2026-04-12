# Custom Components

The editor supports user-defined Vue single-file components stored as plain text
in the Components tab. These files are compiled at runtime and are part of the
shared URL state.

## Source of Truth

Relevant code:

- `src/app/useCustomComponents.ts`
- `src/features/slides/custom-components.ts`
- `src/custom-components.browser.test.ts`

## Data Model

Component files are stored as:

```ts
Record<string, string>
```

Example:

```ts
{
  'Quote.vue': '<template>...</template>'
}
```

The filename determines the registration name:

- `Quote.vue` registers `Quote`
- the same component is also registered as lowercase `quote`

Lowercase registration exists because markdown-it lowercases HTML-like tags.

## Supported SFC Surface

The runtime parser is intentionally small. It extracts:

- `<template>...</template>`
- `<style>...</style>`
- `<script setup>...</script>` only for prop-name detection

It does not run full Vue SFC compilation.

Supported `defineProps` forms:

- `defineProps(['a', 'b'])`
- `defineProps({ title: String })`
- `defineProps<{ a: string; b?: string }>()`

The extracted prop names are turned into permissive runtime prop definitions
that accept `String`, `Number`, `Boolean`, `Object`, and `Array`.

## Runtime Compilation

Compilation flow:

1. Parse each `.vue` file into `{ name, props, template, style }`
2. Compile the template with Vue runtime `compile()`
3. Register the component under PascalCase and lowercase names
4. Concatenate component styles into one `<style>` tag in `document.head`
5. Clear the compiled slide component cache whenever custom components change

The style tag id is:

```text
slidev-custom-component-styles
```

## Failure Modes

If a component file has no `<template>`, or template compilation throws, the app
does not crash the deck. Instead it registers an error component that renders
`SlidevErrorBlock` with the failure message.

This behavior is intentional and covered by browser tests.

## Editor Behavior

- Component files are editable alongside slides in `EditorLayout`
- Adding a new file creates a generated filename such as `Comp1.vue`
- The generated filename matters because it becomes the component tag name
- Component files are included in shared URLs

If the slide uses `<MyComp>` but the file is named `Comp1.vue`, nothing will
resolve until the markdown uses `<Comp1>`.

## Constraints

- These are runtime playground components, not full app-level Vue modules
- Styles are global within the page-level custom-component style tag
- Component compilation changes require cache invalidation because slide
  templates are compiled and cached separately

## Testing Notes

Current tests verify:

- rendering a single component
- rendering multiple component files together
- style injection
- graceful error rendering for broken components
- editor-driven add/edit flows
- shared URL restoration with component files
