import { RangeSetBuilder } from '@codemirror/state'
import {
  Decoration,
  EditorView,
  GutterMarker,
  ViewPlugin,
  type ViewUpdate,
  gutter,
} from '@codemirror/view'

// --- Slide boundary detection ---

type SlideRegion = {
  /** 1-based slide number */
  number: number
  /** Line number (1-based) where this slide starts */
  startLine: number
  /** Line number (1-based) of the `---` separator that ends the previous slide (0 for first slide) */
  separatorLine: number
}

function findSlideRegions(doc: {
  lines: number
  line: (n: number) => { text: string }
}): SlideRegion[] {
  const regions: SlideRegion[] = []
  let slideNumber = 1
  let inFrontmatter = false
  let frontmatterClosed = false

  // Check if doc starts with frontmatter
  if (doc.lines >= 1 && doc.line(1).text.trim() === '---') {
    inFrontmatter = true
  }

  regions.push({ number: slideNumber, startLine: 1, separatorLine: 0 })

  for (let i = 1; i <= doc.lines; i++) {
    const lineText = doc.line(i).text.trim()

    if (lineText === '---') {
      if (inFrontmatter && !frontmatterClosed && i > 1) {
        // This closes the frontmatter block — not a slide separator
        frontmatterClosed = true
        continue
      }

      slideNumber++
      regions.push({ number: slideNumber, startLine: i + 1, separatorLine: i })
    }
  }

  return regions
}

// --- Gutter: slide number badges ---

class SlideNumberMarker extends GutterMarker {
  constructor(readonly slideNumber: number) {
    super()
  }

  override toDOM(): HTMLElement {
    const el = document.createElement('span')
    el.className = 'cm-slide-number'
    el.textContent = `${this.slideNumber}`
    return el
  }
}

const slideNumberGutter = gutter({
  class: 'cm-slide-gutter',
  markers(view) {
    const builder = new RangeSetBuilder<GutterMarker>()
    const regions = findSlideRegions(view.state.doc)

    for (const region of regions) {
      if (region.startLine <= view.state.doc.lines) {
        const line = view.state.doc.line(region.startLine)
        builder.add(line.from, line.from, new SlideNumberMarker(region.number))
      }
    }

    return builder.finish()
  },
})

// --- Decorations: separator lines + alternating backgrounds ---

const separatorDecoration = Decoration.line({ class: 'cm-slide-separator' })

const evenSlideDecoration = Decoration.line({ class: 'cm-slide-even' })

function buildDecorations(view: EditorView) {
  const builder = new RangeSetBuilder<Decoration>()
  const regions = findSlideRegions(view.state.doc)

  // Collect all decoration positions so we add them in document order
  const decorations: { pos: number; deco: Decoration }[] = []

  for (const region of regions) {
    // Separator line styling
    if (region.separatorLine > 0 && region.separatorLine <= view.state.doc.lines) {
      const sepLine = view.state.doc.line(region.separatorLine)
      decorations.push({ pos: sepLine.from, deco: separatorDecoration })
    }

    // Alternating background for even slides
    if (region.number % 2 === 0) {
      const startLine = region.startLine
      const nextRegion = regions.find((r) => r.number === region.number + 1)
      const endLine = nextRegion ? nextRegion.separatorLine - 1 : view.state.doc.lines

      for (let i = startLine; i <= Math.min(endLine, view.state.doc.lines); i++) {
        const line = view.state.doc.line(i)
        decorations.push({ pos: line.from, deco: evenSlideDecoration })
      }
    }
  }

  // Sort by position (required by RangeSetBuilder)
  decorations.sort((a, b) => a.pos - b.pos)
  for (const { pos, deco } of decorations) {
    builder.add(pos, pos, deco)
  }

  return builder.finish()
}

const slideBoundaryDecorations = ViewPlugin.define(
  (view) => {
    let decorations = buildDecorations(view)
    return {
      get decorations() {
        return decorations
      },
      update(update: ViewUpdate) {
        if (update.docChanged) {
          decorations = buildDecorations(update.view)
        }
      },
    }
  },
  { decorations: (v) => v.decorations },
)

// --- Theme ---

const slideBoundaryTheme = EditorView.baseTheme({
  // Slide number gutter
  '.cm-slide-gutter': {
    width: '28px',
    minWidth: '28px',
    textAlign: 'center',
    color: 'transparent',
  },
  '.cm-slide-number': {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    fontFamily: 'system-ui, sans-serif',
    lineHeight: '1',
    backgroundColor: 'oklch(0.55 0.15 160 / 0.15)',
    color: 'oklch(0.75 0.12 160)',
  },

  // Separator line — the `&` in baseTheme refers to `.cm-editor`
  // Line decorations are applied to `.cm-line` elements
  '& .cm-line.cm-slide-separator': {
    borderTop: '1px solid oklch(0.55 0.15 160 / 0.35)',
    marginTop: '4px',
    paddingTop: '4px',
  },

  // Alternating slide background
  '& .cm-line.cm-slide-even': {
    backgroundColor: 'oklch(1 0 0 / 0.02)',
  },

  // Dark mode overrides
  '&dark .cm-slide-number': {
    backgroundColor: 'oklch(0.55 0.15 160 / 0.15)',
    color: 'oklch(0.75 0.12 160)',
  },
  '&dark .cm-line.cm-slide-separator': {
    borderTopColor: 'oklch(0.55 0.15 160 / 0.3)',
  },
  '&dark .cm-line.cm-slide-even': {
    backgroundColor: 'oklch(1 0 0 / 0.03)',
  },
})

// --- Public API ---

export const slideBoundaries = [slideNumberGutter, slideBoundaryDecorations, slideBoundaryTheme]
