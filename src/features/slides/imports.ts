import { parseSync } from '@slidev/parser'
import { escapeHtmlAttribute, escapeRegExp } from '../../utils/string-utils'
import { readProjectFile } from './project-files'

export interface ResolvedSlideSource {
  content: string
  filepath: string
  note?: string
  frontmatter: Record<string, unknown>
  index: number
}

const SNIPPET_IMPORT_RE = /^<<<[ \t]*(\S.*?)(#[\w-]+)?[ \t]*(?:[ \t](\S+?))?[ \t]*(\{.*)?[ \t]*$/m

export function resolveSlidesFromMarkdown(
  markdown: string,
  filepath: string,
  stack: string[] = [],
): ResolvedSlideSource[] {
  const normalizedPath = normalizeDeckPath(filepath, '/')
  if (stack.includes(normalizedPath)) {
    return [
      createErrorSlide(
        normalizedPath,
        `Circular slide import detected: ${[...stack, normalizedPath].join(' -> ')}`,
      ),
    ]
  }

  const parsed = parseSync(markdown, normalizedPath)
  const slides: ResolvedSlideSource[] = []

  for (const slide of parsed.slides) {
    const importedPath =
      typeof slide.frontmatter.src === 'string' ? slide.frontmatter.src : undefined

    if (importedPath !== undefined && importedPath !== '') {
      const { filepath: importFilepath, range } = parseImportSource(importedPath)
      const resolvedImportPath = normalizeDeckPath(importFilepath, normalizedPath)
      const importedMarkdown = readProjectFile(resolvedImportPath)

      if (importedMarkdown === undefined) {
        slides.push(
          createErrorSlide(
            normalizedPath,
            `Unable to resolve imported slide deck "${importedPath}" from ${normalizedPath}.`,
            slide.index,
          ),
        )
        continue
      }

      const overrideFrontmatter = { ...slide.frontmatter }
      delete overrideFrontmatter.src

      const importedSlides = resolveSlidesFromMarkdown(importedMarkdown, resolvedImportPath, [
        ...stack,
        normalizedPath,
      ])
      const selectedSlides = selectImportedSlides(importedSlides, range)

      for (const importedSlide of selectedSlides) {
        slides.push({
          ...importedSlide,
          frontmatter: {
            ...importedSlide.frontmatter,
            ...overrideFrontmatter,
          },
        })
      }

      continue
    }

    slides.push({
      content: resolveSnippetImports(slide.content, normalizedPath),
      filepath: slide.filepath,
      note: slide.note,
      frontmatter: { ...slide.frontmatter },
      index: slide.index,
    })
  }

  return slides
}

export function normalizeDeckPath(path: string, fromFilepath: string): string {
  const unixPath = path.replaceAll('\\', '/')
  if (unixPath.startsWith('@/')) {
    return `/${unixPath.slice(2)}`
  }
  if (unixPath.startsWith('/')) {
    return unixPath
  }

  const fromParts = fromFilepath.split('/').slice(0, -1)
  const targetParts = unixPath.split('/')
  const resolvedParts = [...fromParts]

  for (const part of targetParts) {
    if (part === '.' || part === '') {
      continue
    }
    if (part === '..') {
      if (resolvedParts.length > 1) {
        resolvedParts.pop()
      }
      continue
    }
    resolvedParts.push(part)
  }

  return resolvedParts.join('/') || '/'
}

export function resolveSnippetImports(content: string, fromFilepath: string): string {
  const normalizedFromFilepath = normalizeDeckPath(fromFilepath, '/')

  return content
    .split('\n')
    .map((line) => {
      const match = line.match(SNIPPET_IMPORT_RE)
      if (!match) {
        return line
      }

      const [, rawPath, regionWithHash = '', explicitLanguage = '', rawMeta = ''] = match
      const [pathWithoutRegion] = rawPath.split('#')
      const region = regionWithHash.startsWith('#') ? regionWithHash.slice(1) : ''
      const resolvedPath = normalizeDeckPath(pathWithoutRegion.trim(), normalizedFromFilepath)
      const fileContents = readProjectFile(resolvedPath)

      if (fileContents === undefined) {
        return buildErrorComponent(
          `Unable to resolve snippet import "${pathWithoutRegion.trim()}" from ${normalizedFromFilepath}.`,
        )
      }

      const snippet = region ? extractRegion(fileContents, region) : fileContents
      if (snippet === null) {
        return buildErrorComponent(
          `Region "${region}" was not found in "${pathWithoutRegion.trim()}".`,
        )
      }

      const explicitLanguageValue = explicitLanguage.trim()
      const inferredLanguage = inferLanguageFromPath(pathWithoutRegion.trim())
      const language =
        explicitLanguageValue === '' ? (inferredLanguage ?? 'text') : explicitLanguageValue
      const meta = rawMeta.trim()

      return [`\`\`\`${language}${meta ? ` ${meta}` : ''}`, snippet.replace(/\n$/, ''), '```'].join(
        '\n',
      )
    })
    .join('\n')
}

function parseImportSource(source: string): { filepath: string; range: number[] | null } {
  const [filepath, rawRange] = source.split('#', 2)
  return {
    filepath,
    range: rawRange ? parseSlideRange(rawRange) : null,
  }
}

function parseSlideRange(rawRange: string): number[] {
  return rawRange
    .split(',')
    .flatMap((part) => {
      const trimmed = part.trim()
      if (trimmed === '') {
        return []
      }
      if (trimmed.includes('-')) {
        const [startRaw, endRaw] = trimmed.split('-', 2)
        const start = Number.parseInt(startRaw, 10)
        const end = Number.parseInt(endRaw, 10)
        if (!Number.isFinite(start) || !Number.isFinite(end) || start < 1 || end < start) {
          return []
        }
        return Array.from({ length: end - start + 1 }, (_, index) => start + index)
      }

      const value = Number.parseInt(trimmed, 10)
      return Number.isFinite(value) && value > 0 ? [value] : []
    })
    .filter((value, index, array) => array.indexOf(value) === index)
}

function selectImportedSlides(slides: ResolvedSlideSource[], range: number[] | null) {
  if (!range || range.length === 0) {
    return slides
  }

  return range
    .map((slideNumber) => slides[slideNumber - 1])
    .filter((slide): slide is ResolvedSlideSource => slide !== undefined)
}

function extractRegion(content: string, region: string): string | null {
  const lines = content.split('\n')
  const startPatterns = [
    new RegExp(`^\\s*//\\s*#region\\s+${escapeRegExp(region)}\\s*$`),
    new RegExp(`^\\s*/\\*\\s*#region\\s+${escapeRegExp(region)}\\s*\\*/\\s*$`),
    new RegExp(`^\\s*<!--\\s*#region\\s+${escapeRegExp(region)}\\s*-->\\s*$`),
    new RegExp(`^\\s*#\\s*region\\s+${escapeRegExp(region)}\\s*$`),
  ]
  const endPatterns = [
    /^\s*\/\/\s*#endregion\s*$/,
    /^\s*\/\*\s*#endregion\s*\*\/\s*$/,
    /^\s*<!--\s*#endregion\s*-->\s*$/,
    /^\s*#\s*endregion\s*$/,
  ]

  let collecting = false
  const collected: string[] = []

  for (const line of lines) {
    if (!collecting && startPatterns.some((pattern) => pattern.test(line))) {
      collecting = true
      continue
    }

    if (collecting && endPatterns.some((pattern) => pattern.test(line))) {
      return collected.join('\n')
    }

    if (collecting) {
      collected.push(line)
    }
  }

  return null
}

function createErrorSlide(filepath: string, message: string, index = 0): ResolvedSlideSource {
  return {
    content: buildErrorComponent(message),
    filepath,
    frontmatter: {
      layout: 'default',
      class: 'slidev-import-error',
    },
    index,
  }
}

function buildErrorComponent(message: string): string {
  return `<slidev-error-block message="${escapeHtmlAttribute(message)}"></slidev-error-block>`
}

function inferLanguageFromPath(path: string): string | null {
  const ext = path.split('.').at(-1)?.toLowerCase()
  if (ext === null || ext === undefined || ext === '') {
    return null
  }

  const map: Record<string, string> = {
    cjs: 'javascript',
    css: 'css',
    html: 'html',
    js: 'javascript',
    json: 'json',
    jsx: 'jsx',
    md: 'markdown',
    mjs: 'javascript',
    sh: 'bash',
    ts: 'typescript',
    tsx: 'tsx',
    vue: 'vue',
    yaml: 'yaml',
    yml: 'yaml',
  }

  return map[ext] ?? ext
}
