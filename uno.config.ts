import extractorMdc from '@unocss/extractor-mdc'
import {
  defineConfig,
  presetAttributify,
  presetTypography,
  presetWind3,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default defineConfig({
  safelist: [
    '!opacity-0',
    'prose',
    'dark:prose-invert',
    'grid-rows-[1fr_max-content]',
    'grid-cols-[1fr_max-content]',
  ],
  shortcuts: {
    'bg-main': 'bg-[var(--surface-2)]',
    'bg-active': 'bg-[var(--accent-subtle)]',
    'bg-surface': 'bg-[var(--surface-1)]',
    'bg-elevated': 'bg-[var(--surface-2)]',
    'border-main': 'border-[var(--border-subtle)]',
    'text-main': 'text-[var(--text-primary)]',
    'text-dim': 'text-[var(--text-secondary)]',
    'text-primary': 'color-[var(--theme-accent)]',
    'bg-primary': 'bg-[var(--theme-accent)]',
    'border-primary': 'border-[var(--theme-accent)]',
  },
  theme: {
    fontFamily: {
      sans: 'var(--slidev-fonts-sans)',
      serif: 'var(--slidev-fonts-serif)',
      mono: 'var(--slidev-fonts-mono)',
      display: 'var(--slidev-fonts-display)',
    },
  },
  presets: [presetWind3(), presetAttributify(), presetTypography()],
  transformers: [transformerDirectives({ enforce: 'pre' }), transformerVariantGroup()],
  extractors: [extractorMdc()],
})
