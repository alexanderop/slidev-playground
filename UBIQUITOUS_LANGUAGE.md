# Ubiquitous Language

The vocabulary below is the canonical terminology for the Slidev Playground
domain. Use these terms exactly when discussing the product, writing docs,
or naming new code. Aliases listed under each entry should be avoided.

## Authoring

| Term                  | Definition                                                                                       | Aliases to avoid                    |
| --------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------- |
| **Deck**              | A single Slidev markdown document, plus its custom component files, that the user authors.       | Document, file, presentation source |
| **Slide**             | One renderable unit inside the deck, separated from the next by a `---` line.                    | Page, card                          |
| **Headmatter**        | The first slide's frontmatter, which holds global configuration for the whole deck.              | Global frontmatter, deck config     |
| **Frontmatter**       | YAML metadata at the top of a non-first slide that configures only that slide.                   | Slide config, meta                  |
| **Frontmatter Field** | A single typed binding (e.g. `themeConfig.primary`) edited surgically via `useFrontmatterField`. | Setting, frontmatter key (in code)  |
| **Speaker Note**      | The final HTML comment on a slide, shown to the presenter and segmented by `[click]` markers.    | Presenter note, slide note          |
| **Slide Import**      | A slide whose `src` frontmatter pulls content from another markdown file or range.               | Include, src reference              |
| **Layout**            | A named visual template (`cover`, `two-cols`, …) selected by the `layout` frontmatter field.     | Template, slide style               |
| **Slot**              | A named insertion point exposed by a layout, filled with `::slotName::` slot sugar.              | Section, region                     |

## Components

| Term                   | Definition                                                                                               | Aliases to avoid                     |
| ---------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| **Built-in Component** | A first-party Vue component shipped with the playground (e.g. `Arrow`, `Youtube`, `PoweredBySlidev`).    | Slidev component, internal component |
| **Custom Component**   | A user-authored `.vue` file stored in the deck that compiles at runtime and is part of shared URL state. | User component, SFC, plugin          |
| **Component File**     | The raw text of a custom component as stored in the `componentFiles` map (`Quote.vue` → source).         | Vue file, asset                      |
| **Component Tag Name** | The PascalCase or lowercase name used in markdown, derived from the component file's filename.           | Component name, alias                |

## Rendering

| Term                   | Definition                                                                                                 | Aliases to avoid                 |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------- |
| **Render Pipeline**    | The ordered transform that turns markdown into a compiled Vue slide template (parse → render → compile).   | Build, slide compile, processing |
| **Code Block**         | A fenced source listing inside a slide; supports highlighting, line numbers, filename, Monaco, magic-move. | Snippet, code fence              |
| **Magic Move**         | A code-transition block written with `````md magic-move` that animates between successive code states.     | Code morph, code animation       |
| **KaTeX Block**        | A `$$ … $$` math block, optionally with `{1\|3\|all}` click-step ranges.                                   | Math block, equation             |
| **Snippet Import**     | A `<<< @/path` directive that pulls a code region from another file into a code block.                     | File include, code import        |
| **Scoped Slide Style** | A `<style>` tag at the end of a slide whose CSS is scoped to that slide only.                              | Inline style, slide CSS          |

## Click Model

| Term                 | Definition                                                                                          | Aliases to avoid            |
| -------------------- | --------------------------------------------------------------------------------------------------- | --------------------------- |
| **Click Step**       | One discrete reveal point on a slide, advanced by `next()` or `Space`. Indexed from `0`.            | Step, animation step, frame |
| **Total Clicks**     | The number of click steps a slide exposes, derived from `v-click` directives, magic-move, and math. | Click count, max clicks     |
| **Current Click**    | The active click step on the currently-presented slide.                                             | Click index, step number    |
| **Click Animation**  | A `v-click`, `v-after`, or `v-clicks` directive that ties content visibility to a click step.       | Reveal, animation           |
| **Click Navigation** | `next()` / `prev()` movement that walks click steps before advancing slides.                        | Step navigation             |
| **Slide Navigation** | `nextSlide()` / `prevSlide()` movement that skips clicks and jumps directly between slides.         | Jump navigation             |

## Application Modes

| Term             | Definition                                                                     | Aliases to avoid                  |
| ---------------- | ------------------------------------------------------------------------------ | --------------------------------- |
| **Editor**       | The CodeMirror-based editing surface for deck markdown and component files.    | Code panel, IDE                   |
| **Preview**      | The non-fullscreen live render of the deck shown next to the editor.           | Render pane, live view            |
| **Presentation** | Fullscreen playback mode with click-based reveal, transitions, and speaker UI. | Playback, slideshow, present mode |
| **Overview**     | A modal grid of all slides used to jump between them while presenting.         | Slide picker, grid view           |
| **Goto Dialog**  | A search modal that filters slides by number and jumps to the chosen one.      | Jump dialog, search dialog        |
| **Config Panel** | The settings sidebar that edits selected headmatter fields surgically.         | Style panel, settings             |

## Theme

| Term                    | Definition                                                                                            | Aliases to avoid               |
| ----------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------ |
| **Theme Config**        | The headmatter `themeConfig` object whose entries become `--slidev-theme-*` CSS variables at runtime. | Theme settings                 |
| **Color Schema**        | The frontmatter-declared color preference: `auto \| light \| dark \| all`.                            | Theme mode (in frontmatter)    |
| **Color Mode Override** | A runtime user choice that overrides `colorSchema`: `auto \| light \| dark`.                          | Dark mode toggle               |
| **Effective Mode**      | The resolved `light \| dark` actually applied, after combining override, schema, and OS preference.   | Active mode, current theme     |
| **Theme Tokens**        | The CSS-variable layer in `theme-tokens.css` (shell) and `slidev-vars.css` (slide content).           | Theme variables, design tokens |

## State and Sharing

| Term               | Definition                                                                                      | Aliases to avoid          |
| ------------------ | ----------------------------------------------------------------------------------------------- | ------------------------- |
| **URL Hash State** | The `lz-string`-compressed payload in `window.location.hash` that fully reconstructs the deck.  | URL state, hash, fragment |
| **Compact Hash**   | The legacy hash format containing only compressed markdown (no component files).                | Plain hash, legacy format |
| **JSON Hash**      | The current hash format encoding `{ m, c }` — markdown plus component-file map.                 | New format, full hash     |
| **Share Action**   | The user gesture that flushes pending state and either invokes Web Share API or copies the URL. | Export, copy link         |
| **Revision**       | The content hash on a slide used to detect change for HMR — distinct from the URL hash.         | Hash (without qualifier)  |

## Architecture Layers

| Term                 | Definition                                                                                                        | Aliases to avoid  |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------- |
| **Shared Layer**     | Cross-cutting code under `src/{types,utils,config,styles,composables,components,lint}/`.                          | Common, core, lib |
| **Feature**          | An isolated bounded module under `src/features/{editor,presentation,slides}/`. Features cannot import each other. | Module, package   |
| **Composition Root** | `src/app/` — the only place features may be wired together.                                                       | Entry, root       |
| **Functional Core**  | Pure string-in/string-out frontmatter functions (`applyPatch`, `readPath`) with no Vue imports.                   | Helpers, utils    |
| **Reactive Shell**   | The Vue composable layer (`useFrontmatterField`) that wraps the functional core.                                  | Wrapper, hook     |

## Testing

| Term             | Definition                                                                                | Aliases to avoid                 |
| ---------------- | ----------------------------------------------------------------------------------------- | -------------------------------- |
| **Browser Test** | A `*.browser.test.ts` file run in Chromium via Playwright that mounts the real `App.vue`. | E2E test, integration test       |
| **Deck Builder** | The `deck()` factory in `src/test-utils/deck-builder.ts` used to compose test markdown.   | Markdown helper, fixture builder |
| **Page Object**  | An `AppPage`-style wrapper exposing semantic, user-centred actions and assertions.        | Wrapper, helper                  |
| **Disposable**   | A test object cleaned up automatically through `using` and `Symbol.dispose`.              | Fixture cleanup, teardown        |

## Relationships

- A **Deck** contains one **Headmatter** (on slide `1`) and many **Slides**.
- A **Slide** has at most one **Frontmatter**, one **Layout**, zero or more
  **Slots**, and exactly one **Speaker Note**.
- A **Slide** exposes a **Total Clicks** count derived from its **Click
  Animations**, **Magic Move** blocks, and **KaTeX Blocks**.
- A **Deck** owns a `Record<string, string>` of **Component Files**; each one
  registers exactly one **Custom Component** under its **Component Tag Name**.
- The **URL Hash State** serializes the **Deck** in either **Compact Hash**
  (markdown only) or **JSON Hash** (markdown + component files) form.
- The **Effective Mode** is resolved from the **Color Mode Override** first,
  the **Color Schema** second, and OS preference last.
- **Click Navigation** advances **Current Click** until it equals **Total
  Clicks**, then defers to **Slide Navigation**.
- A **Feature** depends only on the **Shared Layer**; the **Composition Root**
  is the only module allowed to depend on a **Feature**.

## Example dialogue

> **Dev:** "When the user opens the **Config Panel** and changes the primary
> color, where does that value live?"

> **Domain expert:** "It's a **Frontmatter Field** on `themeConfig.primary` in
> the **Headmatter**. `useFrontmatterField` patches the markdown surgically
> through the **Functional Core** so we don't re-serialize the whole document
> and lose comments."

> **Dev:** "And it ends up affecting both the **Preview** and the
> **Presentation**?"

> **Domain expert:** "Right. `useTheme` reads `themeConfig` plus the
> **Color Mode Override** to compute the **Effective Mode**, then writes
> `--theme-accent` and the rest of the **Theme Tokens** onto
> `document.documentElement`. Both modes share the same root, so it just
> works."

> **Dev:** "What if the user **Share**s the deck before that change debounces
> into the **URL Hash State**?"

> **Domain expert:** "The **Share Action** force-flushes the latest state
> first. If there are no **Component Files** the deck goes out as a **Compact
> Hash**; otherwise it's a **JSON Hash** with the markdown and the component
> map under `m` and `c`."

## Flagged ambiguities

- **"Speaker note" vs "presenter note"** — both are used in the codebase and
  upstream Slidev docs. Canonical: **Speaker Note**. Use everywhere; treat
  "presenter note" as a Slidev-spec alias only.
- **"Click"** is overloaded as event, count, and step. Disambiguate by always
  qualifying: **Click Step** (one reveal), **Total Clicks** (count on a
  slide), **Current Click** (active step), **Click Animation** (the directive),
  **Click Navigation** vs **Slide Navigation** (movement modes).
- **"Slide"** is used both for the source representation (`SourceSlideInfo`)
  and the resolved/rendered representation (`SlideInfo`). In domain
  conversation, use **Slide** for the user-facing concept; reserve the type
  names for code-level discussion.
- **"Theme"** refers to three distinct things in upstream Slidev: a theme
  package (`theme: seriph`), the runtime CSS theme tokens, and `themeConfig`
  values. The playground does not load theme packages — only **Theme Config**
  and **Theme Tokens** are meaningful here. Avoid bare "theme" when you mean
  one of the specific concepts.
- **"Hash"** is used for both the **URL Hash State** (location fragment) and
  the per-slide **Revision** (content hash). Always qualify which one.
- **"Component"** alone is ambiguous between **Built-in Component**, **Custom
  Component**, and ordinary Vue components in the app shell. Pick the
  qualified form whenever the distinction matters — especially in docs about
  registration, compilation, or shared state.
- **"Headmatter" vs "frontmatter"** — they are not synonyms here. Headmatter
  is _only_ the first slide's frontmatter and carries global config;
  frontmatter on any other slide is per-slide. Don't say "frontmatter" when
  you mean global config.
- **"Layout"** can mean the YAML field, the layout name string, or a Vue
  layout component. Code references the field; **Layout** in domain
  conversation refers to the named visual template selected by that field.
