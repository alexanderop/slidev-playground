import type { Highlighter } from 'shiki'
import { createJavaScriptRegexEngine } from '@shikijs/engine-javascript'
import { createHighlighter } from 'shiki'

let highlighterPromise: Promise<Highlighter> | undefined

const LANGS = [
  'typescript',
  'javascript',
  'python',
  'plaintext',
  'html',
  'css',
  'json',
  'yaml',
  'bash',
  'vue',
  'markdown',
] as const

const THEMES = ['vitesse-dark', 'vitesse-light'] as const

const LANG_SET: ReadonlySet<string> = new Set(LANGS)

function isSupportedLanguage(language: string): language is (typeof LANGS)[number] {
  return LANG_SET.has(language)
}

export function getShikiHighlighter(): Promise<Highlighter> {
  highlighterPromise ??= createHighlighter({
    engine: createJavaScriptRegexEngine(),
    langs: [...LANGS],
    themes: [...THEMES],
  })
  return highlighterPromise
}

type HighlightSet = 'all' | Set<number>

function resolveHighlights(value: number[] | 'all' | undefined): HighlightSet {
  return value === 'all' ? 'all' : new Set(value ?? [])
}

function hasAnyHighlight(set: HighlightSet): boolean {
  return set === 'all' || set.size > 0
}

function isLineHighlighted(set: HighlightSet, lineNumber: number): boolean {
  return set === 'all' || set.has(lineNumber)
}

function decorateLine(
  line: Element,
  options: {
    relativeLineNumber: number
    absoluteLineNumber: number
    showLineNumbers: boolean
    highlights: HighlightSet
    anyHighlight: boolean
  },
) {
  if (options.showLineNumbers && line instanceof HTMLElement) {
    line.dataset.line = String(options.absoluteLineNumber)
  }
  const isHighlighted = isLineHighlighted(options.highlights, options.relativeLineNumber)
  if (isHighlighted) {
    line.classList.add('highlighted')
    return
  }
  if (options.anyHighlight) {
    line.classList.add('dishonored')
  }
}

export async function getCodeBlockHtml(
  code: string,
  language: string,
  options: {
    highlightedLines?: number[] | 'all'
    lineNumbers?: boolean
    startLine?: number
  } = {},
) {
  const highlighter = await getShikiHighlighter()
  const normalizedLang = isSupportedLanguage(language) ? language : 'plaintext'
  const html = highlighter.codeToHtml(code, {
    lang: normalizedLang,
    themes: {
      light: 'vitesse-light',
      dark: 'vitesse-dark',
    },
    defaultColor: false,
  })

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const lineElements = [...doc.querySelectorAll('.line')]
  const highlights = resolveHighlights(options.highlightedLines)
  const anyHighlight = hasAnyHighlight(highlights)
  const startLine = options.startLine ?? 1
  const showLineNumbers = options.lineNumbers === true

  for (const [index, line] of lineElements.entries()) {
    decorateLine(line, {
      relativeLineNumber: index + 1,
      absoluteLineNumber: startLine + index,
      showLineNumbers,
      highlights,
      anyHighlight,
    })
  }

  // Remove Shiki's inline background-color on <pre> so our CSS variable takes over
  const preElement = doc.querySelector('pre')
  if (preElement) {
    preElement.style.removeProperty('background-color')
  }

  return doc.body.innerHTML
}
