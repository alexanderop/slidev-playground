import type { Ref } from 'vue'
import { useEventListener } from '@vueuse/core'

type PresentationApi = {
  presenting: Ref<boolean>
  showOverview: Ref<boolean>
  showNotes: Ref<boolean>
  showGotoDialog: Ref<boolean>
  start: (slideIndex?: number) => void
  stop: () => void
  next: () => void
  prev: () => void
  nextSlide: () => void
  prevSlide: (lastClicks?: boolean) => void
}

type PresentationKeyOptions = {
  toggleDark?: () => void
  toggleFullscreen?: () => void | Promise<void>
}

type GlobalHandlerContext = {
  api: PresentationApi
  toggleDark?: () => void
  tryToggleFullscreen: () => Promise<void>
}

function isShortcutBlocked(): boolean {
  const target = document.activeElement
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || !!target.closest('.cm-editor')
  )
}

function startWithDialog(api: PresentationApi, type: 'overview' | 'goto') {
  if (!api.presenting.value) {
    api.start(0)
  }
  if (type === 'overview') {
    api.showOverview.value = true
    api.showGotoDialog.value = false
    return
  }
  api.showGotoDialog.value = true
  api.showOverview.value = false
}

function handleGlobalShortcuts(event: KeyboardEvent, ctx: GlobalHandlerContext): boolean {
  const { api, toggleDark, tryToggleFullscreen } = ctx
  const key = event.key
  const lower = key.toLowerCase()

  if (lower === 'o' || key === '`') {
    event.preventDefault()
    if (!api.presenting.value) {
      startWithDialog(api, 'overview')
      return true
    }
    api.showOverview.value = !api.showOverview.value
    api.showGotoDialog.value = false
    return true
  }

  if (lower === 'd') {
    event.preventDefault()
    toggleDark?.()
    return true
  }

  if (lower === 'g') {
    event.preventDefault()
    if (!api.presenting.value) {
      startWithDialog(api, 'goto')
      return true
    }
    api.showGotoDialog.value = !api.showGotoDialog.value
    api.showOverview.value = false
    return true
  }

  if (lower === 'p') {
    event.preventDefault()
    if (api.presenting.value) {
      api.stop()
      return true
    }
    api.start(0)
    return true
  }

  if (lower === 'f') {
    if (!api.presenting.value) {
      return false
    }
    event.preventDefault()
    if (!event.repeat) {
      void tryToggleFullscreen()
    }
    return true
  }

  return false
}

function handleDialogShortcuts(event: KeyboardEvent, api: PresentationApi): boolean {
  const key = event.key
  const lower = key.toLowerCase()

  if (key === 'Escape') {
    event.preventDefault()
    if (api.showGotoDialog.value) {
      api.showGotoDialog.value = false
      return true
    }
    if (api.showOverview.value) {
      api.showOverview.value = false
      return true
    }
    api.stop()
    return true
  }

  if (lower === 'n') {
    event.preventDefault()
    api.showNotes.value = !api.showNotes.value
    return true
  }

  return false
}

function handleNavigationKey(event: KeyboardEvent, api: PresentationApi): boolean {
  switch (event.key) {
    case ' ':
      event.preventDefault()
      if (event.shiftKey) {
        api.prev()
        return true
      }
      api.next()
      return true
    case 'ArrowRight':
      event.preventDefault()
      if (event.shiftKey) {
        api.nextSlide()
        return true
      }
      api.next()
      return true
    case 'ArrowLeft':
      event.preventDefault()
      if (event.shiftKey) {
        api.prevSlide()
        return true
      }
      api.prev()
      return true
    case 'ArrowDown':
      event.preventDefault()
      api.nextSlide()
      return true
    case 'ArrowUp':
      event.preventDefault()
      api.prevSlide()
      return true
    case 'PageDown':
      event.preventDefault()
      api.next()
      return true
    case 'PageUp':
      event.preventDefault()
      api.prev()
      return true
    default:
      return false
  }
}

export function usePresentationKeys(api: PresentationApi, options: PresentationKeyOptions = {}) {
  const { toggleDark, toggleFullscreen } = options

  async function tryToggleFullscreen() {
    if (!toggleFullscreen || !api.presenting.value) {
      return
    }

    await toggleFullscreen()
  }

  if (typeof window !== 'undefined') {
    useEventListener(window, 'keydown', (event: KeyboardEvent) => {
      if (isShortcutBlocked()) {
        return
      }

      if (handleGlobalShortcuts(event, { api, toggleDark, tryToggleFullscreen })) {
        return
      }

      if (!api.presenting.value) {
        return
      }

      if (handleDialogShortcuts(event, api)) {
        return
      }

      if (api.showGotoDialog.value || api.showOverview.value) {
        return
      }

      handleNavigationKey(event, api)
    })
  }
}
