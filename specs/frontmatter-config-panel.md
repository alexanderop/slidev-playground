# Frontmatter Style Configurator

## Overview

A collapsible sidebar panel that lets users configure Slidev frontmatter styling properties through a visual UI. Changes sync bidirectionally between the panel and the markdown editor in real time.

## Motivation

Users currently must know Slidev YAML syntax to style their presentations. A visual config panel lowers the barrier — especially for non-developers — while keeping the markdown as the source of truth.

## UI Entry Point

- Replace the existing `ThemeSwitcher` component in the header with a single **palette icon button**.
- Clicking the button toggles a **sidebar panel** that overlays the right side of the preview pane.
- The panel has a close button (X) and a title like "Style".
- The panel does **not** push/resize the editor or preview layout — it floats on top with a semi-transparent backdrop on the preview area.

### Header (before)

```
| Logo | 3 slides | ☀/☾ ●●●● | Share | Present |
```

### Header (after)

```
| Logo | 3 slides | 🎨 | Share | Present |
```

## Configurable Properties

The panel exposes these frontmatter fields, grouped into sections:

### General

| Field | Input type | Frontmatter key | Default |
| ----- | ---------- | --------------- | ------- |
| Title | Text input | `title`         | `""`    |

### Color

| Field         | Input type                     | Frontmatter key       | Default   |
| ------------- | ------------------------------ | --------------------- | --------- |
| Color mode    | Toggle (auto/light/dark)       | `colorSchema`         | `auto`    |
| Primary color | Native color picker + hex text | `themeConfig.primary` | `#4fc08d` |
| Canvas width  | Number input                   | `canvasWidth`         | `980`     |
| Aspect ratio  | Select (16:9 / 4:3 / 1:1)      | `aspectRatio`         | `16/9`    |

### Typography

| Field     | Input type                   | Frontmatter key | Default |
| --------- | ---------------------------- | --------------- | ------- |
| Sans font | Text input with autocomplete | `fonts.sans`    | `""`    |
| Mono font | Text input with autocomplete | `fonts.mono`    | `""`    |

## Font Autocomplete

The sans and mono font fields show autocomplete suggestions from a curated list of ~25 popular Google Fonts. Users can type any value — the list is for discoverability, not restriction.

Suggested list (sans): Inter, Roboto, Open Sans, Poppins, Montserrat, Lato, Nunito, Raleway, Source Sans 3, Work Sans, DM Sans, Plus Jakarta Sans, Outfit, Manrope, Space Grotesk, Geist, Figtree, Lexend, Sora, Albert Sans.

Suggested list (mono): Fira Code, JetBrains Mono, Source Code Pro, IBM Plex Mono, Roboto Mono, Ubuntu Mono, Space Mono, Inconsolata, Cascadia Code, DM Mono.

## Bidirectional Sync

### Panel → Markdown (write)

- When the user changes any field in the panel, the raw markdown string is updated **immediately** (live as you type, no debounce).
- **Surgical line replacement**: only the specific YAML line for the changed property is modified. All other formatting, comments, key ordering, and whitespace in the frontmatter block are preserved.
- If no frontmatter block exists, one is **auto-created** at the top of the markdown (`---\n...\n---`) on the first panel edit.
- If a property is being added for the first time (e.g., `fonts:` block doesn't exist), insert it in a logical position within the existing frontmatter.

### Markdown → Panel (read)

- The panel reads its values from the **parsed frontmatter** (via `useHeadmatter` / `@slidev/parser`).
- When the user edits the YAML directly in the code editor, the panel fields update reactively.
- This is the existing reactive pipeline: `markdown` → `parseSync` → `config` computed. The panel simply reads from `config`.

## Removing the ThemeSwitcher

The existing `ThemeSwitcher` component (dark/light toggle + color scheme dots) is **replaced** by the new config panel:

- The dark/light toggle moves into the panel as the "Color mode" field.
- The color scheme dots (green/blue/rose/neutral) are removed — the primary color picker in the panel replaces them.
- The `useTheme` composable's `colorScheme` localStorage state and `schemeColors` mapping become unused and can be removed. The primary color is now always sourced from frontmatter.
- The `mode` localStorage state is also removed — color mode is driven by `colorSchema` in frontmatter.

## YAML Editing Strategy

### Surgical replacement algorithm

1. Find the frontmatter block boundaries (`---` delimiters on lines 1 and N).
2. For the target property (e.g., `fonts.sans`):
   - Search within the frontmatter for the line matching the key pattern.
   - Replace only the value portion of that line.
3. If the key doesn't exist:
   - For top-level keys (`title`, `colorSchema`): append before the closing `---`.
   - For nested keys (`fonts.sans`, `themeConfig.primary`): find or create the parent key, then insert the child indented below it.
4. If the user clears a field to empty:
   - Remove the line from the frontmatter (don't leave `key: ""`).
   - If the parent object becomes empty (e.g., `fonts:` with no children), remove the parent too.

### Edge cases

- **Quoted values**: Primary color values with `#` must be quoted in YAML (`primary: '#4fc08d'`). The panel must ensure proper quoting.
- **No frontmatter**: Insert `---\n<key>: <value>\n---\n\n` at position 0 of the markdown.
- **Empty frontmatter** (`---\n---`): Insert the key between the delimiters.

## Component Architecture

### New components

- `ConfigPanel.vue` — The sidebar panel with all form fields.
- `FontAutocomplete.vue` — Reusable text input with dropdown suggestions.

### New composable

- `useFrontmatterEditor(markdown: Ref<string>)` — Exposes methods to surgically update frontmatter properties in the raw markdown string. Returns `{ updateProperty, removeProperty }`.

### Modified components

- `EditorLayout.vue` — Add palette icon button, conditionally render `ConfigPanel`, emit/handle panel toggle state.
- `App.vue` — Remove `useTheme` localStorage-based color scheme logic; theme is now fully frontmatter-driven.

### Removed components

- `ThemeSwitcher.vue` — Functionality absorbed into `ConfigPanel`.

## Implementation Notes

- The panel reads from the already-computed `config` (from `useHeadmatter`), so no new parsing logic is needed for the read direction.
- The write direction (`useFrontmatterEditor`) operates on the raw markdown string, not on the parsed AST. This avoids round-tripping through a YAML serializer.
- The editor now supports typed headmatter values beyond strings, including numbers, booleans, arrays, and deeper nested key paths.
- The `useTheme` composable still handles applying CSS variables to the DOM — it just no longer has its own localStorage-based state for color scheme selection.
- Panel open/close state can be a simple local `ref<boolean>` — no need to persist it.

## Out of Scope

- Per-slide frontmatter editing (background, class, layout, transition) — this spec covers only the global headmatter.
- Theme selection (`theme: default` vs other Slidev themes) — the playground only supports the default theme.
- Extended font options (serif, weights, italic, provider).
- Canvas width / aspect ratio configuration.
- Arbitrary themeConfig keys beyond `primary`.
