export type FenceHighlightStep = number[] | ['all']

export interface ParsedFenceInfo {
  filename: string | null
  highlightSteps: FenceHighlightStep[]
  highlightedLines: number[]
  language: string
  lineNumbers: boolean | null
  startLine: number | null
}

function isAllHighlightStep(step: FenceHighlightStep): step is ['all'] {
  return step[0] === 'all'
}

export function parseFenceInfo(info: string): ParsedFenceInfo {
  const trimmed = info.trim()
  const language = trimmed.split(/\s+/)[0] ?? ''
  const filenameMatch = trimmed.match(/\[([^\]]+)\]/)
  const metaBlocks = [...trimmed.matchAll(/\{([^}]+)\}/g)].map((match) => match[1].trim())

  let lineNumbers: boolean | null = null
  const highlightedLines: number[] = []
  let highlightSteps: FenceHighlightStep[] = []
  let startLine: number | null = null

  for (const meta of metaBlocks) {
    for (const part of meta.split(',')) {
      const trimmedPart = part.trim()
      if (trimmedPart === 'lines:true' || trimmedPart === 'lineNumbers:true') {
        lineNumbers = true
        continue
      }
      if (trimmedPart === 'lines:false' || trimmedPart === 'lineNumbers:false') {
        lineNumbers = false
        continue
      }
      if (trimmedPart.startsWith('startLine:')) {
        const value = Number.parseInt(trimmedPart.slice('startLine:'.length), 10)
        startLine = Number.isFinite(value) && value > 0 ? value : null
      }
    }

    if (meta.includes('|')) {
      highlightSteps = meta
        .split('|')
        .map((step) => parseHighlightToken(step.trim()))
        .filter((step): step is FenceHighlightStep => step !== null)
      continue
    }

    const parsedHighlight = parseHighlightToken(meta)
    if (parsedHighlight === null) {
      continue
    }

    if (isAllHighlightStep(parsedHighlight)) {
      highlightSteps = [['all']]
      continue
    }
    highlightedLines.push(...parsedHighlight)
  }

  return {
    filename: filenameMatch?.[1] ?? null,
    highlightSteps,
    highlightedLines,
    language,
    lineNumbers,
    startLine,
  }
}

function parseHighlightToken(meta: string): FenceHighlightStep | null {
  if (meta === '' || meta === 'none') {
    return []
  }
  if (meta === 'all' || meta === '*') {
    return ['all']
  }
  if (!/^\d/.test(meta)) {
    return null
  }
  return parseLineRange(meta)
}

function parseLineRange(meta: string): number[] {
  return meta
    .split(',')
    .flatMap((part) => {
      const trimmed = part.trim()
      if (trimmed.includes('-')) {
        const [startRaw, endRaw] = trimmed.split('-')
        const start = Number.parseInt(startRaw, 10)
        const end = Number.parseInt(endRaw, 10)
        if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
          return []
        }
        return Array.from({ length: end - start + 1 }, (_, index) => start + index)
      }

      const value = Number.parseInt(trimmed, 10)
      return Number.isFinite(value) ? [value] : []
    })
    .filter((value, index, array) => array.indexOf(value) === index)
}
