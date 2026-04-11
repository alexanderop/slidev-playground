import type { Ref } from 'vue'
import { useClipboard, useDebounceFn, useShare } from '@vueuse/core'
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import { watch } from 'vue'
import { DEBOUNCE_URL_MS } from '../config/constants'

export interface PlaygroundState {
  markdown: string
  componentFiles: Record<string, string>
}

export interface PlaygroundDefaults {
  markdown: string
  componentFiles: Record<string, string>
}

export function useUrlSync(
  markdown: Ref<string>,
  componentFiles: Ref<Record<string, string>>,
  defaults: PlaygroundDefaults,
) {
  const { copy, copied } = useClipboard({ legacy: true })
  const { share: nativeShare, isSupported: isShareSupported } = useShare()

  function loadFromHash(): PlaygroundState {
    const hash = window.location.hash.slice(1)
    if (!hash) {
      return { markdown: defaults.markdown, componentFiles: defaults.componentFiles }
    }
    try {
      const raw = decompressFromEncodedURIComponent(hash)
      if (!raw) {
        return { markdown: defaults.markdown, componentFiles: defaults.componentFiles }
      }
      return decodeState(raw, defaults.markdown)
    } catch {
      return { markdown: defaults.markdown, componentFiles: defaults.componentFiles }
    }
  }

  function encode(): string {
    const hasComponents = Object.keys(componentFiles.value).length > 0
    if (!hasComponents) {
      return compressToEncodedURIComponent(markdown.value)
    }
    return compressToEncodedURIComponent(
      JSON.stringify({ m: markdown.value, c: componentFiles.value }),
    )
  }

  const updateHash = useDebounceFn(() => {
    history.replaceState(null, '', `#${encode()}`)
  }, DEBOUNCE_URL_MS)

  watch(markdown, updateHash)
  watch(componentFiles, updateHash, { deep: true })

  async function share() {
    window.location.hash = encode()
    const url = window.location.href

    if (isShareSupported.value) {
      await nativeShare({ title: 'Slidev Playground', url })
      return
    }

    await copy(url)
  }

  return { loadFromHash, share, copied }
}

function decodeState(raw: string, defaultContent: string): PlaygroundState {
  // New format: JSON with { m, c } keys
  if (raw.startsWith('{')) {
    try {
      const parsed: unknown = JSON.parse(raw)
      if (typeof parsed === 'object' && parsed !== null) {
        const obj = parsed as Record<string, unknown>
        const markdown = typeof obj.m === 'string' ? obj.m : defaultContent
        const componentFiles = isRecordOfStrings(obj.c) ? obj.c : {}
        return { markdown, componentFiles }
      }
      return { markdown: defaultContent, componentFiles: {} }
    } catch {
      return { markdown: defaultContent, componentFiles: {} }
    }
  }
  // Legacy format: plain markdown string
  return { markdown: raw, componentFiles: {} }
}

function isRecordOfStrings(value: unknown): value is Record<string, string> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }
  return Object.values(value as Record<string, unknown>).every((v) => typeof v === 'string')
}
