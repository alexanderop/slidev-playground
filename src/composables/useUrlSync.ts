import type { Ref } from 'vue'
import { useClipboard, useDebounceFn, useShare } from '@vueuse/core'
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import { watch } from 'vue'
import { DEBOUNCE_URL_MS } from '../constants'

export function useUrlSync(markdown: Ref<string>, defaultContent: string) {
  const { copy, copied } = useClipboard({ legacy: true })
  const { share: nativeShare, isSupported: isShareSupported } = useShare()

  function loadFromHash(): string {
    const hash = window.location.hash.slice(1)
    if (!hash) {
      return defaultContent
    }
    try {
      return decompressFromEncodedURIComponent(hash) || defaultContent
    } catch {
      return defaultContent
    }
  }

  const updateHash = useDebounceFn(() => {
    const compressed = compressToEncodedURIComponent(markdown.value)
    history.replaceState(null, '', `#${compressed}`)
  }, DEBOUNCE_URL_MS)

  watch(markdown, updateHash)

  async function share() {
    const compressed = compressToEncodedURIComponent(markdown.value)
    window.location.hash = compressed
    const url = window.location.href

    if (isShareSupported.value) {
      await nativeShare({ title: 'Slidev Playground', url })
    } else {
      await copy(url)
    }
  }

  return { loadFromHash, share, copied }
}
