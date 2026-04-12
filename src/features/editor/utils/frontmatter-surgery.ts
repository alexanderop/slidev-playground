import { escapeRegExp } from '../../../utils/string-utils'

export type YamlScalar = string | number | boolean
export type YamlValue = YamlScalar | Array<string>

type FrontmatterState = {
  frontmatter: Array<string>
  body: Array<string>
}

type PathMatch = {
  index: number
  blockEnd: number
}

export function parseFrontmatter(text: string): FrontmatterState {
  const lines = text.split('\n')
  const bounds = getFrontmatterBounds(lines)

  if (bounds === null) {
    return {
      frontmatter: [],
      body: lines,
    }
  }

  return {
    frontmatter: lines.slice(bounds.start + 1, bounds.end),
    body: lines.slice(bounds.end + 1),
  }
}

export function stateToMarkdown(state: FrontmatterState): string {
  if (!state.frontmatter.some((line) => line.trim() !== '')) {
    const body = [...state.body]
    while (body[0]?.trim() === '') {
      body.shift()
    }
    return body.join('\n')
  }

  const body = [...state.body]
  if (body.length > 0 && body[0]?.trim() !== '') {
    body.unshift('')
  }

  return ['---', ...state.frontmatter, '---', ...body].join('\n')
}

export function updatePath(frontmatter: Array<string>, path: Array<string>, value: YamlValue) {
  if (path.length === 0) {
    return
  }

  const formatted = formatYamlValue(value)
  let rangeStart = 0
  let rangeEnd = frontmatter.length
  let indent = 0

  for (let depth = 0; depth < path.length; depth += 1) {
    const key = path[depth]
    const index = findKeyIndex(frontmatter, key, indent, rangeStart, rangeEnd)
    const isLeaf = depth === path.length - 1

    if (index === -1) {
      const line = `${getIndent(indent)}${key}:${isLeaf ? ` ${formatted}` : ''}`
      frontmatter.splice(rangeEnd, 0, line)

      if (!isLeaf) {
        rangeStart = rangeEnd + 1
        rangeEnd = rangeStart
        indent += 2
      }
      continue
    }

    if (isLeaf) {
      frontmatter[index] = replaceYamlValue(frontmatter[index], formatted)
      return
    }

    frontmatter[index] = replaceYamlValue(frontmatter[index], '').replace(/\s+$/, '')

    rangeStart = index + 1
    rangeEnd = findBlockEnd(frontmatter, index)
    indent += 2
  }
}

export function removePath(frontmatter: Array<string>, path: Array<string>) {
  if (path.length === 0) {
    return
  }

  const matches = findPath(frontmatter, path)
  if (matches.length === 0) {
    return
  }

  const leaf = matches.at(-1)
  if (!leaf) {
    return
  }

  frontmatter.splice(leaf.index, leaf.blockEnd - leaf.index)

  for (let i = matches.length - 2; i >= 0; i -= 1) {
    const match = matches[i]
    if (hasChildEntries(frontmatter, match.index)) {
      break
    }

    frontmatter.splice(match.index, 1)
  }
}

function getFrontmatterBounds(lines: Array<string>): { start: number; end: number } | null {
  if (lines[0]?.trim() !== '---') {
    return null
  }

  for (let i = 1; i < lines.length; i++) {
    if (lines[i]?.trim() === '---') {
      return { start: 0, end: i }
    }
  }

  return null
}

function findPath(frontmatter: Array<string>, path: Array<string>): Array<PathMatch> {
  const matches: Array<PathMatch> = []
  let rangeStart = 0
  let rangeEnd = frontmatter.length
  let indent = 0

  for (const key of path) {
    const index = findKeyIndex(frontmatter, key, indent, rangeStart, rangeEnd)
    if (index === -1) {
      return []
    }

    const blockEnd = findBlockEnd(frontmatter, index)
    matches.push({ index, blockEnd })
    rangeStart = index + 1
    rangeEnd = blockEnd
    indent += 2
  }

  return matches
}

function findKeyIndex(
  lines: Array<string>,
  key: string,
  indent: number,
  start: number,
  end: number,
): number {
  const pattern = new RegExp(`^${escapeRegExp(getIndent(indent) + key)}(\\s*):`)

  for (let index = start; index < end; index += 1) {
    if (pattern.test(lines[index] ?? '')) {
      return index
    }
  }

  return -1
}

function findBlockEnd(lines: Array<string>, keyIndex: number): number {
  const parentIndent = getLineIndent(lines[keyIndex] ?? '')
  let end = keyIndex + 1

  while (end < lines.length) {
    const line = lines[end] ?? ''
    if (line.trim() !== '' && getLineIndent(line) <= parentIndent) {
      break
    }
    end += 1
  }
  return end
}

function replaceYamlValue(line: string, formattedValue: string): string {
  const colonIndex = line.indexOf(':')
  if (colonIndex === -1) {
    return line
  }

  const prefix = line.slice(0, colonIndex + 1)
  const afterColon = line.slice(colonIndex + 1)
  const spacing = afterColon.match(/^\s*/)?.[0] ?? ' '
  const commentIndex = findCommentIndex(afterColon)
  const suffix =
    commentIndex === -1 ? '' : afterColon.slice(findCommentStart(afterColon, commentIndex))

  if (!formattedValue) {
    return suffix ? `${prefix}${suffix}` : prefix
  }

  return `${prefix}${spacing}${formattedValue}${suffix}`
}

function findCommentIndex(value: string): number {
  let inSingle = false
  let inDouble = false

  for (let i = 0; i < value.length; i++) {
    const char = value[i]
    if (char === "'" && !inDouble) {
      inSingle = !inSingle
      continue
    }
    if (char === '"' && !inSingle) {
      inDouble = !inDouble
      continue
    }
    if (char === '#' && !inSingle && !inDouble) {
      return i
    }
  }

  return -1
}

function findCommentStart(value: string, commentIndex: number): number {
  let index = commentIndex
  while (index > 0 && /\s/.test(value[index - 1] ?? '')) {
    index -= 1
  }
  return index
}

function formatYamlValue(value: YamlValue): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => formatYamlString(item)).join(', ')}]`
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return formatYamlString(value)
}

function formatYamlString(value: string): string {
  if (
    value === '' ||
    value.startsWith('#') ||
    value.includes(':') ||
    value.includes('[') ||
    value.includes(']') ||
    value.includes('{') ||
    value.includes('}') ||
    value.includes(',') ||
    value.trim() !== value ||
    /^[-?]|^\d/.test(value) ||
    /^(true|false|null|yes|no|on|off)$/i.test(value)
  ) {
    return quoteYamlString(value)
  }

  return value
}

function quoteYamlString(value: string): string {
  return `'${value.replaceAll("'", "''")}'`
}

function hasChildEntries(frontmatter: Array<string>, keyIndex: number): boolean {
  const blockEnd = findBlockEnd(frontmatter, keyIndex)
  const parentIndent = getLineIndent(frontmatter[keyIndex] ?? '')

  return frontmatter.slice(keyIndex + 1, blockEnd).some((line) => {
    const trimmed = line.trim()
    if (trimmed === '' || trimmed.startsWith('#')) {
      return false
    }

    return getLineIndent(line) > parentIndent
  })
}

function getIndent(size: number): string {
  return ' '.repeat(size)
}

function getLineIndent(line: string): number {
  return line.match(/^\s*/)?.[0].length ?? 0
}
