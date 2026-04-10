import type { EditorView } from '@codemirror/view'
import type { Ref } from 'vue'
import { useScroll } from '@vueuse/core'
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

type SyncSource = 'editor' | 'preview'

interface ScrollContainer {
  clientHeight: number
  scrollHeight: number
}

export function getScrollableHeight(element: ScrollContainer): number {
  return Math.max(element.scrollHeight - element.clientHeight, 0)
}

export function getScrollProgress(element: ScrollContainer, scrollTop: number): number {
  const scrollableHeight = getScrollableHeight(element)

  if (scrollableHeight === 0) {
    return 0
  }

  return Math.min(Math.max(scrollTop / scrollableHeight, 0), 1)
}

export function getScrollTopForProgress(element: ScrollContainer, progress: number): number {
  return getScrollableHeight(element) * Math.min(Math.max(progress, 0), 1)
}

export function useScrollSync(
  editorView: Ref<EditorView | null>,
  previewContainer: Ref<HTMLElement | null>,
  contentMarker: Ref<unknown>,
) {
  const editorScrollElement = ref<HTMLElement | null>(null)
  const editorScroll = useScroll(editorScrollElement, { behavior: 'auto' })
  const previewScroll = useScroll(previewContainer, { behavior: 'auto' })
  const syncSource = ref<SyncSource | null>(null)
  let syncResetTimer = 0

  function clearSyncSource() {
    window.clearTimeout(syncResetTimer)
    syncResetTimer = 0
    syncSource.value = null
  }

  function markSyncSource(source: SyncSource) {
    syncSource.value = source
    window.clearTimeout(syncResetTimer)
    syncResetTimer = window.setTimeout(clearSyncSource, 120)
  }

  function syncScroll(source: SyncSource) {
    const editorElement = editorScrollElement.value
    const previewElement = previewContainer.value
    if (!editorElement || !previewElement) {
      return
    }

    const fromElement = source === 'editor' ? editorElement : previewElement
    const toElement = source === 'editor' ? previewElement : editorElement
    const fromY = source === 'editor' ? editorScroll.y.value : previewScroll.y.value
    const toY = source === 'editor' ? previewScroll.y.value : editorScroll.y.value

    const progress = getScrollProgress(fromElement, fromY)
    const nextScrollTop = getScrollTopForProgress(toElement, progress)

    if (Math.abs(nextScrollTop - toY) < 1) {
      return
    }

    markSyncSource(source)
    if (source === 'editor') {
      previewScroll.y.value = nextScrollTop
      return
    }

    editorScroll.y.value = nextScrollTop
  }

  watch(
    editorView,
    (view) => {
      editorScrollElement.value = view?.scrollDOM ?? null
    },
    { immediate: true },
  )

  watch(
    () => editorScroll.y.value,
    () => {
      if (syncSource.value === 'preview') {
        return
      }

      syncScroll('editor')
    },
  )

  watch(
    () => previewScroll.y.value,
    () => {
      if (syncSource.value === 'editor') {
        return
      }

      syncScroll('preview')
    },
  )

  watch(
    [editorView, previewContainer, contentMarker],
    () => {
      void nextTick(() => {
        editorScroll.measure()
        previewScroll.measure()
        clearSyncSource()
        syncScroll('editor')
      })
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    clearSyncSource()
  })
}
