import type MarkdownIt from 'markdown-it'
import type StateInline from 'markdown-it/lib/rules_inline/state_inline.mjs'
import type StateBlock from 'markdown-it/lib/rules_block/state_block.mjs'
import { renderToString } from 'katex'
import { escapeHtmlAttribute } from '../../utils/string-utils'
import { tryRun } from '../../utils/try-run'

export type KatexPluginResult = { mathClicks: number }

const RE_KATEX_BLOCK_INFO = /^\{([\w*,|-]+)\}/

function isWhitespaceCode(code: number): boolean {
  return code === 0x20 || code === 0x09
}

function isDigitCode(code: number): boolean {
  return code >= 0x30 && code <= 0x39
}

function isValidDelim(state: StateInline, pos: number) {
  const max = state.posMax
  const prevChar = pos > 0 ? (state.src.codePointAt(pos - 1) ?? -1) : -1
  const nextChar = pos + 1 <= max ? (state.src.codePointAt(pos + 1) ?? -1) : -1

  const canOpen = !isWhitespaceCode(nextChar)
  const canClose = !isWhitespaceCode(prevChar) && !isDigitCode(nextChar)

  return { canOpen, canClose }
}

function findUnescapedDollar(src: string, start: number): number {
  let match = start
  while ((match = src.indexOf('$', match)) !== -1) {
    let pos = match - 1
    while (src[pos] === '\\') {
      pos -= 1
    }
    if ((match - pos) % 2 === 1) {
      return match
    }
    match += 1
  }
  return -1
}

function emitFallback(state: StateInline, silent: boolean, pending: string, nextPos: number) {
  if (!silent) {
    state.pending += pending
  }
  state.pos = nextPos
  return true
}

function mathInline(state: StateInline, silent: boolean) {
  if (state.src[state.pos] !== '$') {
    return false
  }

  if (!isValidDelim(state, state.pos).canOpen) {
    return emitFallback(state, silent, '$', state.pos + 1)
  }

  const start = state.pos + 1
  const match = findUnescapedDollar(state.src, start)

  if (match === -1) {
    return emitFallback(state, silent, '$', start)
  }
  if (match - start === 0) {
    return emitFallback(state, silent, '$$', start + 1)
  }
  if (!isValidDelim(state, match).canClose) {
    return emitFallback(state, silent, '$', start)
  }

  if (!silent) {
    const token = state.push('math_inline', 'math', 0)
    token.markup = '$'
    token.content = state.src.slice(start, match)
  }
  state.pos = match + 1
  return true
}

type BlockScanResult = { endLine: number; lastLine: string; found: boolean }

function scanBlockClose(state: StateBlock, start: number, end: number): BlockScanResult {
  let next = start
  while (next < end) {
    next++
    if (next >= end) {
      break
    }
    const pos = state.bMarks[next] + state.tShift[next]
    const max = state.eMarks[next]
    if (pos < max && state.tShift[next] < state.blkIndent) {
      break
    }
    if (state.src.slice(pos, max).trim().endsWith('$$')) {
      const lastPos = state.src.slice(0, max).lastIndexOf('$$')
      return { endLine: next, lastLine: state.src.slice(pos, lastPos), found: true }
    }
  }
  return { endLine: next, lastLine: '', found: false }
}

function mathBlock(state: StateBlock, start: number, end: number, silent: boolean) {
  const initialPos = state.bMarks[start] + state.tShift[start]
  const initialMax = state.eMarks[start]

  if (initialPos + 2 > initialMax) {
    return false
  }
  if (state.src.slice(initialPos, initialPos + 2) !== '$$') {
    return false
  }
  if (silent) {
    return true
  }

  let firstLine = state.src.slice(initialPos + 2, initialMax).trim()
  let singleLine = false
  if (firstLine.endsWith('$$')) {
    firstLine = firstLine.slice(0, -2).trim()
    singleLine = true
  }

  const scan = singleLine
    ? { endLine: start, lastLine: '', found: true }
    : scanBlockClose(state, start, end)

  state.line = scan.endLine + 1
  const token = state.push('math_block', 'math', 0)
  token.block = true
  token.content = singleLine
    ? firstLine
    : state.getLines(start + 1, scan.endLine, state.tShift[start], true) +
      (scan.lastLine.trim() === '' ? '' : scan.lastLine)
  if (!singleLine) {
    token.info = firstLine
  }
  token.map = [start, state.line]
  token.markup = '$$'
  return true
}

function escapeVue(html: string): string {
  return html.replaceAll('{{', '&lbrace;&lbrace;')
}

export function katexPlugin(md: MarkdownIt, result: KatexPluginResult): void {
  md.inline.ruler.after('escape', 'math_inline', mathInline)
  md.block.ruler.after('blockquote', 'math_block', mathBlock, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  })

  md.renderer.rules.math_inline = (tokens, idx) => {
    const [error, rendered] = tryRun(() =>
      renderToString(tokens[idx].content, { displayMode: false }),
    )
    if (error !== undefined || rendered === undefined) {
      return tokens[idx].content
    }
    return escapeVue(rendered)
  }

  md.renderer.rules.math_block = (tokens, idx) => {
    const token = tokens[idx]
    const infoMatch = RE_KATEX_BLOCK_INFO.exec(token.info)

    const [error, rendered] = tryRun(() => renderToString(token.content, { displayMode: true }))
    if (error !== undefined || rendered === undefined) {
      return `<p>${token.content}</p>`
    }
    const html = escapeVue(rendered)

    if (infoMatch === null) {
      return `<p>${html}</p>\n`
    }

    const rangeStr = infoMatch[1]
    const ranges = rangeStr.trim() === '' ? [] : rangeStr.split('|').map((s) => s.trim())
    result.mathClicks = Math.max(result.mathClicks, ranges.length - 1)

    return `<slidev-katex-block ranges="${escapeHtmlAttribute(JSON.stringify(ranges))}">${html}</slidev-katex-block>\n`
  }
}
