# Tech Ticket: Adopt Slidev preparser extensions for render-time transforms

**Status:** Proposed
**Area:** `src/features/slides/`
**Upstream reference:** `/Users/alexanderopalic/Projects/opensource/slidev/packages/parser/src/core.ts`

---

## Problem

`src/features/slides/render.ts` runs three ad-hoc regex passes over raw
markdown **on every render**:

- `render.ts:336-362` — `magic-move` code-block rewriting
- `render.ts:364-388` — `<CodeGroup>` tabbed code blocks
- `slots.ts:6-38` — `::slot-name::` region splitting

Consequences:

1. Work repeats on every re-render instead of running once at parse time.
2. Each transform's contract is scattered across `render.ts` / `slots.ts` with
   no single home.
3. Upstream already ships a first-class hook for exactly this — the
   `SlidevPreparserExtension` API — and we aren't using it.
4. KaTeX presence is re-detected in the playground even though upstream's
   `parseSync()` already exposes a feature flag (`detectFeatures`).

---

## How upstream Slidev does it

Upstream parses line-by-line (no markdown-it at the parser layer), splitting
on `---`, and exposes **preparser extensions** that can mutate raw lines,
slide content, or notes before the renderer ever sees them.

### The extension interface

`packages/types/src/types.ts:130-135`:

```ts
export interface SlidevPreparserExtension {
  name?: string
  transformRawLines?: (lines: string[]) => Promise<void> | void
  transformSlide?: (content: string, frontmatter: any) => Promise<string | undefined>
  transformNote?: (note: string | undefined, frontmatter: any) => Promise<string | undefined>
}
```

Three hooks:

- `transformRawLines` — mutate the full line array before slide splitting.
  Ideal for syntax that spans slides or must survive splitting.
- `transformSlide` — rewrite a single slide's content after frontmatter has
  been extracted. Ideal for magic-move, `CodeGroup`, slots.
- `transformNote` — rewrite a slide's speaker note.

### How the parser invokes them

`packages/parser/src/core.ts:240-245` (raw-line pass, before splitting):

```ts
if (extensions) {
  for (const e of extensions) {
    if (e.transformRawLines) await e.transformRawLines(lines)
  }
}
```

`packages/parser/src/core.ts:214-234` (per-slide pass, inside `slice()` after
`parseSlide()` has extracted frontmatter):

```ts
if (extensions) {
  for (const e of extensions) {
    if (e.transformSlide) {
      const newContent = await e.transformSlide(slide.content, slide.frontmatter)
      if (newContent !== undefined) slide.content = newContent
      if (typeof slide.frontmatter.title === 'string') {
        slide.title = slide.frontmatter.title
      }
      if (typeof slide.frontmatter.level === 'number') {
        slide.level = slide.frontmatter.level
      }
    }

    if (e.transformNote) {
      const newNote = await e.transformNote(slide.note, slide.frontmatter)
      if (newNote !== undefined) slide.note = newNote
    }
  }
}
```

Note ordering: `transformRawLines` runs once at the top of `parse()`,
`transformSlide` runs once per slide inside the splitter. Both run **before**
the renderer, so any transform declared here is cached inside
`SourceSlideInfo.content` for the lifetime of the parse result.

### Upstream's KaTeX feature detection

`packages/parser/src/core.ts:134-141`:

```ts
export function detectFeatures(code: string): SlidevDetectedFeatures {
  return {
    katex: !!code.match(RE_DOLLAR_INLINE) || !!code.match(RE_DOLLAR_BLOCK),
    monaco: RE_MONACO_BLOCK.test(code) ? scanMonacoReferencedMods(code) : false,
    tweet: !!code.match(RE_TWEET_TAG),
    mermaid: !!code.match(RE_MERMAID_CODEBLOCK),
  }
}
```

This already runs as part of `parseSync()`. The playground re-detecting KaTeX
inside the renderer is duplicate work.

---

## What the playground currently does

### Magic-move (`src/features/slides/render.ts:336-362`)

`````ts
function preprocessMagicMove(content: string): { content: string; magicMoveClicks: number } {
  let magicMoveClicks = 0
  const magicMoveRegex = /````+md\s+magic-move(?:\s+\{[^}]*\})?\s*\n([\s\S]*?)````+/g

  const result = content.replaceAll(magicMoveRegex, (_match, inner: string) => {
    const steps: Array<{ code: string; lang: string }> = []
    const codeBlockRegex = /```(\w*)[^\n]*\n([\s\S]*?)```/g
    let codeMatch: RegExpExecArray | null

    while ((codeMatch = codeBlockRegex.exec(inner)) !== null) {
      steps.push({
        code: codeMatch[2].replace(/\n$/, ''),
        lang: codeMatch[1] || 'typescript',
      })
    }

    if (steps.length === 0) return ''

    magicMoveClicks = Math.max(magicMoveClicks, steps.length - 1)
    const stepsEncoded = encodeURIComponent(JSON.stringify(steps))
    return `<slidev-magic-move steps="${stepsEncoded}" lang="${steps[0].lang}"></slidev-magic-move>`
  })

  return { content: result, magicMoveClicks }
}
`````

### CodeGroup (`src/features/slides/render.ts:364-388`)

````ts
function preprocessCodeGroups(
  content: string,
  options: RenderMarkdownOptions,
): { content: string; codeClicks: number } {
  let codeClicks = 0
  const codeGroupRegex = /<CodeGroup>\s*([\s\S]*?)\s*<\/CodeGroup>/gi

  const result = content.replaceAll(codeGroupRegex, (_match, inner: string) => {
    const codeBlockRegex = /```([^\n]*)\n([\s\S]*?)```/g
    const blocks: string[] = []
    let blockMatch: RegExpExecArray | null

    while ((blockMatch = codeBlockRegex.exec(inner)) !== null) {
      const fenceInfo = blockMatch[1]
      const code = blockMatch[2].replace(/\n$/, '')
      const { codeClicks: blockClicks, html } = renderFence(fenceInfo, code, options)
      codeClicks = Math.max(codeClicks, blockClicks)
      blocks.push(html)
    }

    return `<div>\n<codegroup>${blocks.join('\n')}</codegroup>\n</div>`
  })

  return { content: result, codeClicks }
}
````

### Slot splitter (`src/features/slides/slots.ts:6-38`)

```ts
const SLOT_RE = /^::\s*([\w.\-:]+)\s*::\s*$/

export function splitSlideSlots(content: string): SlideSlotContent[] {
  const lines = content.split('\n')
  const slots: SlideSlotContent[] = []
  let currentSlot = 'default'
  let buffer: string[] = []

  function commit() {
    /* ... */
  }

  for (const line of lines) {
    const match = line.match(SLOT_RE)
    if (match) {
      commit()
      currentSlot = match[1]
      continue
    }
    buffer.push(line)
  }
  commit()
  return slots.filter((slot, index) => slot.content !== '' || index === 0)
}
```

All three run inside the render path today, not the parse path.

---

## Proposal

Move these text-level transforms out of `render.ts` / `slots.ts` and into
preparser extensions registered against the upstream parser via
`parseSync()`'s extensions argument.

### Target shape

```ts
// src/features/slides/preparser/magic-move.ts
import type { SlidevPreparserExtension } from '@slidev/types'

export function magicMoveExtension(): SlidevPreparserExtension {
  return {
    name: 'playground:magic-move',
    transformSlide(content) {
      // same regex as preprocessMagicMove, but returns rewritten content
      // OR returns undefined if no magic-move block was found
    },
  }
}
```

```ts
// src/features/slides/preparser/code-group.ts
export function codeGroupExtension(options: RenderMarkdownOptions): SlidevPreparserExtension {
  return {
    name: 'playground:code-group',
    transformSlide(content) {
      /* ... */
    },
  }
}
```

```ts
// src/features/slides/preparser/slots.ts
// Either keep slot splitting as a post-parse step on SourceSlideInfo,
// or encode slot regions into a stable marker the renderer consumes.
```

Then at parse time:

```ts
const parsed = parseSync(markdown, filepath, [
  magicMoveExtension(),
  codeGroupExtension(renderOptions),
])
```

### Scope

- [ ] Extract magic-move preprocessor into a `SlidevPreparserExtension`;
      remove `preprocessMagicMove` from `render.ts`.
- [ ] Extract `CodeGroup` preprocessor into a `SlidevPreparserExtension`;
      remove `preprocessCodeGroups` from `render.ts`. Note: this transform
      depends on `RenderMarkdownOptions` (for `renderFence`), so the
      extension must be constructed with those options at parse time.
- [ ] Move `splitSlideSlots` out of the render path. Either expose slot
      regions as a field on the parsed slide info, or emit a deterministic
      marker in `transformSlide` that the renderer consumes without
      re-splitting.
- [ ] Read KaTeX usage from upstream's `detectFeatures` result on
      `SlidevMarkdown` instead of re-detecting in the renderer.
- [ ] Keep `click-processor.ts` as-is (needs live DOM) but normalize the
      annotation format it scans for via the same extension layer.

### Out of scope

- Custom markdown-it instance and KaTeX rendering plugin in `render.ts:47-55`
  (upstream ships no renderer; this is legitimately playground-owned).
- DOM-based click directive processing.

### Click-counting caveat

Both `preprocessMagicMove` and `preprocessCodeGroups` currently return a
click count alongside rewritten content. Preparser extensions return only
`string | undefined`, so click counts must be recovered either by:

1. Encoding them into the emitted HTML (e.g. a `data-clicks="N"` attribute)
   and reading them back in the renderer / click-processor, or
2. Re-deriving them at render time from the emitted component markup.

Option 1 keeps parse-time truth; option 2 keeps the extension pure.
Prefer option 1.

---

## Acceptance criteria

- `render.ts` contains no regex transforms over raw markdown; it only
  consumes parsed output.
- Magic-move, `CodeGroup`, and slot handling each live in a single file
  under `src/features/slides/preparser/`, registered as preparser extensions.
- Click counts for magic-move and `CodeGroup` remain correct (covered by
  `src/click-system.browser.test.ts`).
- Existing browser tests pass unchanged:
  - `src/slide-blocks.browser.test.ts`
  - `src/click-system.browser.test.ts`
  - `src/user-flows.browser.test.ts`
- `vp run check` clean.

---

## Risks

- Preparser extensions run at parse time; any transform that depended on
  render-time state (e.g. `RenderMarkdownOptions` for `CodeGroup`) must be
  audited before moving. `CodeGroup` in particular calls `renderFence` —
  decide whether to pass options into the extension factory or defer the
  fence render back to the renderer with a structured marker.
- Slot regions becoming part of the parsed data model means downstream
  consumers of `SourceSlideInfo` need to tolerate the new field.
- Preparser hooks are declared `async` upstream; the playground's sync
  `parseSync()` path must stay sync. Extensions we author must not await.

---

## References

- Upstream preparser interface:
  `/Users/alexanderopalic/Projects/opensource/slidev/packages/types/src/types.ts:130-135`
- Upstream parser hook invocation:
  `/Users/alexanderopalic/Projects/opensource/slidev/packages/parser/src/core.ts:214-245`
- Upstream feature detection:
  `/Users/alexanderopalic/Projects/opensource/slidev/packages/parser/src/core.ts:134-141`
- Playground magic-move preprocessor:
  `src/features/slides/render.ts:336-362`
- Playground CodeGroup preprocessor:
  `src/features/slides/render.ts:364-388`
- Playground slot splitter:
  `src/features/slides/slots.ts:6-38`
