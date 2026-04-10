import type { Ref } from 'vue'
import type { resolveFonts } from '@slidev/parser'
import { onScopeDispose, watch } from 'vue'

export type ResolvedFontOptions = ReturnType<typeof resolveFonts>

const LINK_ID = 'slidev-playground-fonts'
const LINK_SELECTOR = `#${LINK_ID}`

function updateFontVars(resolved: ResolvedFontOptions) {
  const root = document.documentElement
  if (resolved.sans.length > 0) {
    root.style.setProperty('--slidev-fonts-sans', resolved.sans.join(', '))
  }
  if (resolved.serif.length > 0) {
    root.style.setProperty('--slidev-fonts-serif', resolved.serif.join(', '))
  }
  if (resolved.mono.length > 0) {
    root.style.setProperty('--slidev-fonts-mono', resolved.mono.join(', '))
  }
}

export function buildGoogleFontsUrl(fonts: ResolvedFontOptions): string | null {
  const { webfonts, weights, italic } = fonts
  if (webfonts.length === 0) {
    return null
  }

  const families = webfonts.map((font: string) => {
    const encoded = font.replaceAll(' ', '+')
    const axes: string[] = []

    if (italic) {
      for (const w of weights) {
        axes.push(`0,${w}`)
        axes.push(`1,${w}`)
      }
      return `family=${encoded}:ital,wght@${axes.join(';')}`
    }

    const wAxes = weights.map((w: string) => `0,${w}`).join(';')
    return `family=${encoded}:wght@${wAxes}`
  })

  return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`
}

export function useFontLoader(fonts: Ref<ResolvedFontOptions>) {
  let currentUrl: string | null = null

  function updateLink(url: string | null) {
    if (url === currentUrl) {
      return
    }
    currentUrl = url

    const existing = document.querySelector(LINK_SELECTOR)
    if (url === null) {
      existing?.remove()
      return
    }

    if (existing instanceof HTMLLinkElement) {
      existing.href = url
    } else {
      const link = document.createElement('link')
      link.id = LINK_ID
      link.rel = 'stylesheet'
      link.href = url
      document.head.append(link)
    }
  }

  watch(
    fonts,
    (resolved) => {
      updateFontVars(resolved)
      if (resolved.provider === 'none') {
        updateLink(null)
        return
      }
      updateLink(buildGoogleFontsUrl(resolved))
    },
    { immediate: true, deep: true },
  )

  onScopeDispose(() => {
    document.querySelector(LINK_SELECTOR)?.remove()
    currentUrl = null
  })
}
