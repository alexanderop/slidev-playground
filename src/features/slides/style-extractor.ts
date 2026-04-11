const STYLE_RE = /<style\b[^>]*>([\s\S]*?)<\/style>/gi

export function extractStyles(content: string): { content: string; styles: string[] } {
  const styles: string[] = []
  const cleaned = content.replace(STYLE_RE, (_, css: string) => {
    const trimmed = css.trim()
    if (trimmed !== '') {
      styles.push(trimmed)
    }
    return ''
  })
  return { content: cleaned, styles }
}

export function scopeCSS(css: string, scopeId: string): string {
  const result: string[] = []
  let i = 0

  while (i < css.length) {
    // Skip whitespace
    while (i < css.length && /\s/.test(css[i])) {
      result.push(css[i])
      i++
    }

    if (i >= css.length) {
      break
    }

    // Handle @-rules
    if (css[i] === '@') {
      i = processAtRule(css, i, scopeId, result)
      continue
    }

    // Read selector(s) up to {
    let selector = ''
    while (i < css.length && css[i] !== '{') {
      selector += css[i]
      i++
    }

    if (i >= css.length) {
      result.push(selector)
      break
    }

    // Scope the selector
    const scopedSelector = selector
      .split(',')
      .map((s) => {
        const trimmed = s.trim()
        if (trimmed === '') {
          return s
        }
        if (trimmed === ':root') {
          return `#${scopeId}`
        }
        return `#${scopeId} ${trimmed}`
      })
      .join(',')

    result.push(scopedSelector)

    const block = extractBlock(css, i)
    result.push(block)
    i += block.length
  }

  return result.join('')
}

function processAtRule(css: string, start: number, scopeId: string, result: string[]): number {
  let i = start
  let atName = ''
  while (i < css.length && css[i] !== '{' && css[i] !== ';') {
    atName += css[i]
    i++
  }

  if (i < css.length && css[i] === ';') {
    result.push(atName + ';')
    return i + 1
  }

  if (i < css.length && css[i] === '{') {
    const name = atName.trim().toLowerCase()
    if (name.startsWith('@keyframes') || name.startsWith('@font-face')) {
      result.push(atName)
      const block = extractBlock(css, i)
      result.push(block)
      return i + block.length
    }

    // @media, @supports, etc. — recurse into the block
    result.push(atName + '{')
    i++
    const inner = extractInnerBlock(css, i)
    result.push(scopeCSS(inner.content, scopeId))
    result.push('}')
    return inner.end
  }

  return i
}

function extractBlock(css: string, start: number): string {
  let depth = 0
  let i = start
  let block = ''
  while (i < css.length) {
    block += css[i]
    if (css[i] === '{') {
      depth++
    }
    if (css[i] === '}') {
      depth--
      if (depth === 0) {
        break
      }
    }
    i++
  }
  return block
}

function extractInnerBlock(css: string, start: number): { content: string; end: number } {
  let depth = 1
  let i = start
  let content = ''
  while (i < css.length && depth > 0) {
    if (css[i] === '{') {
      depth++
    }
    if (css[i] === '}') {
      depth--
      if (depth === 0) {
        i++
        break
      }
    }
    content += css[i]
    i++
  }
  return { content, end: i }
}
