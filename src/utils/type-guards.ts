export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function getOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

export function getOptionalRecord(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined
}

export function getOptionalStringArray(value: unknown): readonly string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }
  return value.every((item): item is string => typeof item === 'string') ? value : undefined
}

export function parsePositiveInt(value: string | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null
  }
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed) || parsed < 0) {
    return null
  }
  return parsed
}

export type HighlightStep = readonly number[] | readonly ['all']

export function parseHighlightSteps(json: string): readonly HighlightStep[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) {
    return []
  }
  const result: HighlightStep[] = []
  for (const step of parsed) {
    if (!Array.isArray(step)) {
      return []
    }
    if (step.length === 1 && step[0] === 'all') {
      result.push(['all'])
      continue
    }
    if (step.every((n) => typeof n === 'number' && Number.isFinite(n))) {
      result.push(step as readonly number[])
      continue
    }
    return []
  }
  return result
}

export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`)
}
