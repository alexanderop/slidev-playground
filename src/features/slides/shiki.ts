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

function isSupportedLanguage(language: string): language is (typeof LANGS)[number] {
  return LANGS.some((supportedLanguage) => supportedLanguage === language)
}

export function getShikiHighlighter(): Promise<Highlighter> {
  highlighterPromise ??= createHighlighter({
    engine: createJavaScriptRegexEngine(),
    langs: [...LANGS],
    themes: [...THEMES],
  })
  return highlighterPromise
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
  const highlightedLineSet =
    options.highlightedLines === 'all' ? 'all' : new Set(options.highlightedLines ?? [])
  const startLine = options.startLine ?? 1

  const hasHighlights =
    highlightedLineSet === 'all' ||
    (highlightedLineSet instanceof Set && highlightedLineSet.size > 0)

  for (const [index, line] of lineElements.entries()) {
    const lineNumber = startLine + index
    const relativeLineNumber = index + 1
    if (options.lineNumbers === true && line instanceof HTMLElement) {
      line.dataset.line = String(lineNumber)
    }
    const isHighlighted = highlightedLineSet === 'all' || highlightedLineSet.has(relativeLineNumber)
    if (isHighlighted) {
      line.classList.add('highlighted')
    }
    if (!isHighlighted && hasHighlights) {
      line.classList.add('dishonored')
    }
  }

  // Remove Shiki's inline background-color on <pre> so our CSS variable takes over
  const preElement = doc.querySelector('pre')
  if (preElement) {
    preElement.style.removeProperty('background-color')
  }

  return doc.body.innerHTML
}
