export type ShortcutEntry = {
  readonly keys: readonly string[]
  readonly description: string
  readonly scope: 'global' | 'presentation'
}

export const SHORTCUTS_CATALOG: readonly ShortcutEntry[] = [
  { keys: ['p'], description: 'Toggle presentation mode', scope: 'global' },
  { keys: ['o'], description: 'Toggle slide overview', scope: 'global' },
  { keys: ['`'], description: 'Toggle slide overview (backtick)', scope: 'global' },
  { keys: ['d'], description: 'Toggle dark mode', scope: 'global' },
  { keys: ['g'], description: 'Open goto slide dialog', scope: 'global' },
  { keys: ['f'], description: 'Toggle fullscreen (while presenting)', scope: 'global' },
  { keys: ['?'], description: 'Show keyboard shortcuts help', scope: 'global' },
  { keys: ['Esc'], description: 'Close dialog or exit presentation', scope: 'presentation' },
  { keys: ['n'], description: 'Toggle speaker notes', scope: 'presentation' },
  {
    keys: ['Space'],
    description: 'Next click (or next slide after last click)',
    scope: 'presentation',
  },
  {
    keys: ['Shift', 'Space'],
    description: 'Previous click (or previous slide)',
    scope: 'presentation',
  },
  { keys: ['ArrowRight'], description: 'Next click or advance slide', scope: 'presentation' },
  {
    keys: ['Shift', 'ArrowRight'],
    description: 'Jump directly to next slide',
    scope: 'presentation',
  },
  { keys: ['ArrowLeft'], description: 'Previous click or rewind slide', scope: 'presentation' },
  {
    keys: ['Shift', 'ArrowLeft'],
    description: 'Jump directly to previous slide',
    scope: 'presentation',
  },
  { keys: ['ArrowDown'], description: 'Next slide', scope: 'presentation' },
  { keys: ['ArrowUp'], description: 'Previous slide', scope: 'presentation' },
  { keys: ['PageDown'], description: 'Advance clicks', scope: 'presentation' },
  { keys: ['PageUp'], description: 'Rewind clicks', scope: 'presentation' },
] as const
