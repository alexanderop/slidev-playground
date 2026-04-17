import { escapeRegExp } from '../../../utils/string-utils'

export type FmPath = string
export type YamlScalar = string | number | boolean | null
export type YamlValue = YamlScalar | YamlScalar[]
export type FmPatch = { op: 'set'; path: FmPath; value: YamlValue } | { op: 'remove'; path: FmPath }

export function applyPatch(markdown: string, patch: FmPatch): string {
  const state = parseFrontmatter(markdown)
  const segments = splitPath(patch.path)
  if (segments.length === 0) {
    return markdown
  }

  if (patch.op === 'set') {
    setPath(state.frontmatter, segments, patch.value)
  }
  if (patch.op === 'remove') {
    removePath(state.frontmatter, segments)
  }

  return serialize(state)
}

export function readPath(markdown: string, path: FmPath): unknown {
  const state = parseFrontmatter(markdown)
  const segments = splitPath(path)
  if (segments.length === 0) {
    return undefined
  }

  const match = findPath(state.frontmatter, segments)
  if (match === null) {
    return undefined
  }

  const line = state.frontmatter[match.index] ?? ''
  const raw = extractRawValue(line)

  if (raw === '' && match.blockEnd > match.index + 1) {
    return readBlock(state.frontmatter, match.index, match.blockEnd)
  }

  return decodeYamlValue(raw)
}

type FrontmatterState = {
  frontmatter: string[]
  body: string[]
  hadFrontmatter: boolean
}

type PathMatch = {
  index: number
  blockEnd: number
}

function splitPath(path: FmPath): string[] {
  if (path === '') {
    return []
  }
  return path.split('.')
}

function parseFrontmatter(text: string): FrontmatterState {
  const lines = text.split('\n')
  const bounds = getFrontmatterBounds(lines)

  if (bounds === null) {
    return { frontmatter: [], body: lines, hadFrontmatter: false }
  }

  return {
    frontmatter: lines.slice(bounds.start + 1, bounds.end),
    body: lines.slice(bounds.end + 1),
    hadFrontmatter: true,
  }
}

function serialize(state: FrontmatterState): string {
  const hasContent = state.frontmatter.some((line) => line.trim() !== '')

  if (!hasContent) {
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

function getFrontmatterBounds(lines: string[]): { start: number; end: number } | null {
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

function setPath(frontmatter: string[], path: string[], value: YamlValue) {
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

function removePath(frontmatter: string[], path: string[]) {
  const matches = findPathChain(frontmatter, path)
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

function findPath(frontmatter: string[], path: string[]): PathMatch | null {
  const chain = findPathChain(frontmatter, path)
  return chain.length === 0 ? null : (chain.at(-1) ?? null)
}

function findPathChain(frontmatter: string[], path: string[]): PathMatch[] {
  const matches: PathMatch[] = []
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
  lines: string[],
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

function findBlockEnd(lines: string[], keyIndex: number): number {
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
    return `[${value.map((item) => formatYamlScalar(item)).join(', ')}]`
  }

  return formatYamlScalar(value)
}

function formatYamlScalar(value: YamlScalar): string {
  if (value === null) {
    return 'null'
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

function hasChildEntries(frontmatter: string[], keyIndex: number): boolean {
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

function extractRawValue(line: string): string {
  const colonIndex = line.indexOf(':')
  if (colonIndex === -1) {
    return ''
  }

  const afterColon = line.slice(colonIndex + 1)
  const commentIndex = findCommentIndex(afterColon)
  const valuePart = commentIndex === -1 ? afterColon : afterColon.slice(0, commentIndex)
  return valuePart.trim()
}

function readBlock(frontmatter: string[], start: number, end: number): unknown {
  const parentIndent = getLineIndent(frontmatter[start] ?? '')
  const childIndent = parentIndent + 2
  const result: Record<string, unknown> = {}

  let index = start + 1
  while (index < end) {
    const line = frontmatter[index] ?? ''
    const trimmed = line.trim()
    if (trimmed === '' || trimmed.startsWith('#') || getLineIndent(line) !== childIndent) {
      index += 1
      continue
    }

    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) {
      index += 1
      continue
    }

    const key = line.slice(childIndent, colonIndex).trim()
    const raw = extractRawValue(line)
    const blockEnd = findBlockEnd(frontmatter, index)

    result[key] =
      raw === '' && blockEnd > index + 1
        ? readBlock(frontmatter, index, blockEnd)
        : decodeYamlValue(raw)
    index = blockEnd
  }

  return result
}

function decodeYamlValue(raw: string): YamlValue {
  const trimmed = raw.trim()
  if (trimmed === '') {
    return null
  }

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const arr = decodeFlowArray(trimmed)
    if (arr !== null) {
      return arr
    }
  }

  return decodeYamlScalar(trimmed)
}

function decodeFlowArray(raw: string): YamlScalar[] | null {
  const inner = raw.slice(1, -1).trim()
  if (inner === '') {
    return []
  }

  const items: string[] = []
  let current = ''
  let inSingle = false
  let inDouble = false

  for (const ch of inner) {
    if (ch === "'" && !inDouble) {
      inSingle = !inSingle
    }
    if (ch === '"' && !inSingle) {
      inDouble = !inDouble
    }
    if (ch === ',' && !inSingle && !inDouble) {
      items.push(current.trim())
      current = ''
      continue
    }
    current += ch
  }
  items.push(current.trim())

  return items.map((item) => decodeYamlScalar(item))
}

function decodeYamlScalar(raw: string): YamlScalar {
  if (raw === '' || raw === '~' || raw === 'null' || raw === 'Null' || raw === 'NULL') {
    return null
  }
  if (raw === 'true' || raw === 'True' || raw === 'TRUE') {
    return true
  }
  if (raw === 'false' || raw === 'False' || raw === 'FALSE') {
    return false
  }
  if (raw.startsWith("'") && raw.endsWith("'") && raw.length >= 2) {
    return raw.slice(1, -1).replaceAll("''", "'")
  }
  if (raw.startsWith('"') && raw.endsWith('"') && raw.length >= 2) {
    return raw
      .slice(1, -1)
      .replaceAll('\\n', '\n')
      .replaceAll('\\t', '\t')
      .replaceAll('\\"', '"')
      .replaceAll('\\\\', '\\')
  }
  if (/^-?\d+$/.test(raw)) {
    return Number.parseInt(raw, 10)
  }
  if (/^-?\d*\.\d+$/.test(raw)) {
    return Number.parseFloat(raw)
  }
  return raw
}
