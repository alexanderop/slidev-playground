import type { Ref } from 'vue'
import { useClipboard, useDebounceFn, useShare } from '@vueuse/core'
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import { watch } from 'vue'
import { z } from 'zod/mini'
import { DEBOUNCE_URL_MS } from '../config/constants'

const UrlStateSchema = z.object({
  m: z.string(),
  c: z.optional(z.record(z.string(), z.string())),
})

import type { Brand } from '../types/brand'

type PlaygroundStateShape = {
  readonly markdown: string
  readonly componentFiles: Record<string, string>
}

export type PlaygroundState = Brand<PlaygroundStateShape, 'PlaygroundState'>

export type PlaygroundDefaults = PlaygroundStateShape

/* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion */
const asPlaygroundState = (value: PlaygroundStateShape): PlaygroundState => value as PlaygroundState

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
      return asPlaygroundState({
        markdown: defaults.markdown,
        componentFiles: defaults.componentFiles,
      })
    }
    try {
      const raw = decompressFromEncodedURIComponent(hash)
      if (!raw) {
        return asPlaygroundState({
          markdown: defaults.markdown,
          componentFiles: defaults.componentFiles,
        })
      }
      return decodeState(raw, defaults.markdown)
    } catch {
      return asPlaygroundState({
        markdown: defaults.markdown,
        componentFiles: defaults.componentFiles,
      })
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
      const result = UrlStateSchema.safeParse(JSON.parse(raw))
      if (result.success) {
        return asPlaygroundState({
          markdown: result.data.m,
          componentFiles: result.data.c ?? {},
        })
      }
      return asPlaygroundState({ markdown: defaultContent, componentFiles: {} })
    } catch {
      return asPlaygroundState({ markdown: defaultContent, componentFiles: {} })
    }
  }
  // Legacy format: plain markdown string
  return asPlaygroundState({ markdown: raw, componentFiles: {} })
}
