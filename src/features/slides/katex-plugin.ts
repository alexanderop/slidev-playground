import type MarkdownIt from 'markdown-it'
import type StateInline from 'markdown-it/lib/rules_inline/state_inline.mjs'
import type StateBlock from 'markdown-it/lib/rules_block/state_block.mjs'
import { renderToString } from 'katex'
import { escapeHtmlAttribute } from '../../utils/string-utils'

export type KatexPluginResult = { mathClicks: number }

const RE_KATEX_BLOCK_INFO = /^\{([\w*,|-]+)\}/

function isValidDelim(state: StateInline, pos: number) {
  const max = state.posMax
  let canOpen = true
  let canClose = true

  const prevChar = pos > 0 ? (state.src.codePointAt(pos - 1) ?? -1) : -1
  const nextChar = pos + 1 <= max ? (state.src.codePointAt(pos + 1) ?? -1) : -1

  if (prevChar === 0x20 || prevChar === 0x09 || (nextChar >= 0x30 && nextChar <= 0x39)) {
    canClose = false
  }
  if (nextChar === 0x20 || nextChar === 0x09) {
    canOpen = false
  }

  return { canOpen, canClose }
}

function mathInline(state: StateInline, silent: boolean) {
  if (state.src[state.pos] !== '$') {
    return false
  }

  const res = isValidDelim(state, state.pos)
  if (!res.canOpen) {
    if (!silent) {
      state.pending += '$'
    }
    state.pos += 1
    return true
  }

  const start = state.pos + 1
  let match = start
  while ((match = state.src.indexOf('$', match)) !== -1) {
    let pos = match - 1
    while (state.src[pos] === '\\') {
      pos -= 1
    }
    if ((match - pos) % 2 === 1) {
      break
    }
    match += 1
  }

  if (match === -1) {
    if (!silent) {
      state.pending += '$'
    }
    state.pos = start
    return true
  }

  if (match - start === 0) {
    if (!silent) {
      state.pending += '$$'
    }
    state.pos = start + 1
    return true
  }

  const checkClose = isValidDelim(state, match)
  if (!checkClose.canClose) {
    if (!silent) {
      state.pending += '$'
    }
    state.pos = start
    return true
  }

  if (!silent) {
    const token = state.push('math_inline', 'math', 0)
    token.markup = '$'
    token.content = state.src.slice(start, match)
  }

  state.pos = match + 1
  return true
}

function mathBlock(state: StateBlock, start: number, end: number, silent: boolean) {
  let pos = state.bMarks[start] + state.tShift[start]
  let max = state.eMarks[start]

  if (pos + 2 > max) {
    return false
  }
  if (state.src.slice(pos, pos + 2) !== '$$') {
    return false
  }

  pos += 2
  let firstLine = state.src.slice(pos, max).trim()

  if (silent) {
    return true
  }

  let singleLine = false
  if (firstLine.endsWith('$$')) {
    firstLine = firstLine.slice(0, -2).trim()
    singleLine = true
  }

  let found = singleLine
  let next = start
  let lastLine = ''

  while (!found) {
    next++
    if (next >= end) {
      break
    }

    pos = state.bMarks[next] + state.tShift[next]
    max = state.eMarks[next]

    if (pos < max && state.tShift[next] < state.blkIndent) {
      break
    }

    if (state.src.slice(pos, max).trim().endsWith('$$')) {
      const lastPos = state.src.slice(0, max).lastIndexOf('$$')
      lastLine = state.src.slice(pos, lastPos)
      found = true
    }
  }

  state.line = next + 1

  const token = state.push('math_block', 'math', 0)
  token.block = true

  token.content = singleLine
    ? firstLine
    : state.getLines(start + 1, next, state.tShift[start], true) +
      (lastLine.trim() === '' ? '' : lastLine)
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
    try {
      return escapeVue(renderToString(tokens[idx].content, { displayMode: false }))
    } catch {
      return tokens[idx].content
    }
  }

  md.renderer.rules.math_block = (tokens, idx) => {
    const token = tokens[idx]
    const infoMatch = RE_KATEX_BLOCK_INFO.exec(token.info)

    let html: string
    try {
      html = escapeVue(renderToString(token.content, { displayMode: true }))
    } catch {
      return `<p>${token.content}</p>`
    }

    if (infoMatch === null) {
      return `<p>${html}</p>\n`
    }

    const rangeStr = infoMatch[1]
    const ranges = rangeStr.trim() === '' ? [] : rangeStr.split('|').map((s) => s.trim())
    result.mathClicks = Math.max(result.mathClicks, ranges.length - 1)

    return `<slidev-katex-block ranges="${escapeHtmlAttribute(JSON.stringify(ranges))}">${html}</slidev-katex-block>\n`
  }
}
