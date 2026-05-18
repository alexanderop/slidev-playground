import type { Ref } from 'vue'
import { usePreferredDark } from '@vueuse/core'
import { computed, watchEffect } from 'vue'

type Mode = 'light' | 'dark'

let initialized = false

function toMode(value: string | undefined): Mode | undefined {
  return value === 'dark' || value === 'light' ? value : undefined
}

export type ThemeOptions = {
  frontmatterPrimary?: Ref<string | undefined>
  frontmatterColorSchema?: Ref<string | undefined>
  themeConfig?: Ref<Record<string, unknown> | undefined>
  runtimeColorSchema?: Ref<'light' | 'dark' | 'auto'>
}

export function useTheme(options: ThemeOptions = {}) {
  const { frontmatterPrimary, frontmatterColorSchema, themeConfig, runtimeColorSchema } = options

  const prefersDark = usePreferredDark()

  const effectiveMode = computed<Mode>(() => {
    const runtime = toMode(runtimeColorSchema?.value)
    if (runtime) {
      return runtime
    }
    const fm = toMode(frontmatterColorSchema?.value)
    if (fm) {
      return fm
    }
    const fallback = frontmatterColorSchema?.value ?? 'auto'
    if (fallback === 'auto') {
      return prefersDark.value ? 'dark' : 'light'
    }
    return 'light'
  })

  if (!initialized && typeof document !== 'undefined') {
    initialized = true

    let previousThemeKeys: readonly string[] = []

    watchEffect(() => {
      const root = document.documentElement
      root.classList.toggle('dark', effectiveMode.value === 'dark')
      applyPrimary(root, frontmatterPrimary?.value)
      const config = themeConfig?.value ?? {}
      applyContrast(root, Number(config.contrast))
      previousThemeKeys = applyThemeConfig(root, config, previousThemeKeys)
    })
  }

  return { effectiveMode }
}

/** @internal Reset module state for testing */
export function _resetThemeForTesting() {
  initialized = false
}

function applyPrimary(root: HTMLElement, primary: string | undefined) {
  const value = primary ?? '#4fc08d'
  root.style.setProperty('--slidev-theme-primary', value)
  root.style.setProperty('--theme-accent', hexToOklch(value))
}

function applyContrast(root: HTMLElement, contrast: number) {
  if (Number.isFinite(contrast) && contrast >= 30 && contrast <= 100) {
    root.style.setProperty('--theme-contrast', String(contrast))
  }
}

function applyThemeConfig(
  root: HTMLElement,
  config: Record<string, unknown>,
  previousKeys: readonly string[],
): readonly string[] {
  const currentKeys = Object.keys(config).filter((k) => k !== 'primary' && k !== 'contrast')
  for (const key of currentKeys) {
    root.style.setProperty(`--slidev-theme-${key}`, String(config[key]))
  }
  for (const key of previousKeys) {
    if (!currentKeys.includes(key)) {
      root.style.removeProperty(`--slidev-theme-${key}`)
    }
  }
  return currentKeys
}

/**
 * Convert a hex color (#rrggbb) to an oklch() CSS string.
 * Uses the sRGB -> linear-sRGB -> OKLab -> OKLCH pipeline.
 */
function hexToOklch(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  // sRGB to linear
  const lr = r <= 0.04045 ? r / 12.92 : ((r + 0.055) / 1.055) ** 2.4
  const lg = g <= 0.04045 ? g / 12.92 : ((g + 0.055) / 1.055) ** 2.4
  const lb = b <= 0.04045 ? b / 12.92 : ((b + 0.055) / 1.055) ** 2.4

  // Linear sRGB to OKLab (via LMS)
  const l_ = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb
  const m_ = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb
  const s_ = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb

  const l1 = Math.cbrt(l_)
  const m1 = Math.cbrt(m_)
  const s1 = Math.cbrt(s_)

  const L = 0.2104542553 * l1 + 0.793617785 * m1 - 0.0040720468 * s1
  const a = 1.9779984951 * l1 - 2.428592205 * m1 + 0.4505937099 * s1
  const bOk = 0.0259040371 * l1 + 0.7827717662 * m1 - 0.808675766 * s1

  const C = Math.sqrt(a * a + bOk * bOk)
  let H = (Math.atan2(bOk, a) * 180) / Math.PI
  if (H < 0) {
    H += 360
  }

  return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)})`
}
