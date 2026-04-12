const transitionReverseMap = {
  'slide-left': 'slide-right',
  'slide-right': 'slide-left',
  'slide-up': 'slide-down',
  'slide-down': 'slide-up',
} as const

export function normalizePresentationTransition(
  transition: string | undefined,
  fallback: string,
): string | undefined {
  if (transition === 'none') {
    return undefined
  }

  return transition ?? fallback
}

export function reverseTransition(name: string): string {
  const lookup: Record<string, string> = transitionReverseMap
  return lookup[name] ?? name
}
