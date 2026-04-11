import type { Ref } from 'vue'
import { usePreferredDark } from '@vueuse/core'
import { computed, watchEffect } from 'vue'

type Mode = 'light' | 'dark'

let initialized = false

export interface ThemeOptions {
  frontmatterPrimary?: Ref<string | undefined>
  frontmatterColorSchema?: Ref<string | undefined>
  themeConfig?: Ref<Record<string, unknown> | undefined>
  runtimeColorSchema?: Ref<'light' | 'dark' | 'auto'>
}

export function useTheme(options: ThemeOptions = {}) {
  const { frontmatterPrimary, frontmatterColorSchema, themeConfig, runtimeColorSchema } = options

  const prefersDark = usePreferredDark()

  const effectiveMode = computed<Mode>(() => {
    const runtime = runtimeColorSchema?.value ?? 'auto'
    if (runtime === 'dark' || runtime === 'light') {
      return runtime
    }

    const fm = frontmatterColorSchema?.value
    if (fm === 'dark' || fm === 'light') {
      return fm
    }

    if ((fm ?? 'auto') === 'auto') {
      return prefersDark.value ? 'dark' : 'light'
    }

    return 'light'
  })

  if (!initialized && typeof document !== 'undefined') {
    initialized = true

    let previousThemeKeys: string[] = []

    watchEffect(() => {
      const root = document.documentElement
      root.classList.toggle('dark', effectiveMode.value === 'dark')

      const primary = frontmatterPrimary?.value ?? '#4fc08d'
      root.style.setProperty('--slidev-theme-primary', primary)
      root.style.setProperty('--theme-accent', hexToOklch(primary))

      // Apply contrast from themeConfig
      const config = themeConfig?.value ?? {}
      const contrast = Number(config.contrast)
      if (Number.isFinite(contrast) && contrast >= 30 && contrast <= 100) {
        root.style.setProperty('--theme-contrast', String(contrast))
      }

      // Apply all themeConfig entries as CSS vars
      const currentKeys = Object.keys(config).filter((k) => k !== 'primary' && k !== 'contrast')
      for (const key of currentKeys) {
        root.style.setProperty(`--slidev-theme-${key}`, String(config[key]))
      }

      // Clean up removed keys
      for (const key of previousThemeKeys) {
        if (!currentKeys.includes(key)) {
          root.style.removeProperty(`--slidev-theme-${key}`)
        }
      }
      previousThemeKeys = currentKeys
    })
  }

  return { effectiveMode }
}

/** @internal Reset module state for testing */
export function _resetThemeForTesting() {
  initialized = false
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
