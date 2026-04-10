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
    theme: 'vitesse-light',
  })

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const lineElements = [...doc.querySelectorAll('.line')]
  const highlightedLineSet =
    options.highlightedLines === 'all' ? 'all' : new Set(options.highlightedLines ?? [])
  const startLine = options.startLine ?? 1

  for (const [index, line] of lineElements.entries()) {
    const lineNumber = startLine + index
    const relativeLineNumber = index + 1
    if (options.lineNumbers === true && line instanceof HTMLElement) {
      line.dataset.line = String(lineNumber)
    }
    if (highlightedLineSet === 'all' || highlightedLineSet.has(relativeLineNumber)) {
      line.classList.add('highlighted')
    }
  }

  return doc.body.innerHTML
}
