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
    'bg-main': 'bg-white dark:bg-[#121212]',
    'bg-active': 'bg-gray-400/10',
    'border-main': 'border-gray/20',
    'text-main': 'text-[#181818] dark:text-[#ddd]',
    'text-primary': 'color-$slidev-theme-primary',
    'bg-primary': 'bg-$slidev-theme-primary',
    'border-primary': 'border-$slidev-theme-primary',
  },
  theme: {
    fontFamily: {
      sans: 'var(--slidev-fonts-sans)',
      serif: 'var(--slidev-fonts-serif)',
      mono: 'var(--slidev-fonts-mono)',
    },
  },
  presets: [presetWind3(), presetAttributify(), presetTypography()],
  transformers: [transformerDirectives({ enforce: 'pre' }), transformerVariantGroup()],
  extractors: [extractorMdc()],
})
