import type { Ref } from 'vue'
import { computed, watchEffect } from 'vue'

type Mode = 'light' | 'dark'

let initialized = false

export interface ThemeOptions {
  frontmatterPrimary?: Ref<string | undefined>
  frontmatterColorSchema?: Ref<string | undefined>
  themeConfig?: Ref<Record<string, unknown> | undefined>
}

export function useTheme(options: ThemeOptions = {}) {
  const { frontmatterPrimary, frontmatterColorSchema, themeConfig } = options

  const effectiveMode = computed<Mode>(() => {
    const fm = frontmatterColorSchema?.value
    if (fm === 'dark' || fm === 'light') {
      return fm
    }

    if (fm === 'auto') {
      return getPreferredMode()
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

      // Apply all themeConfig entries as CSS vars
      const config = themeConfig?.value ?? {}
      const currentKeys = Object.keys(config).filter((k) => k !== 'primary')
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

function getPreferredMode(): Mode {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}
