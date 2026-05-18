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

function toggleDialog(api: PresentationApi, type: 'overview' | 'goto'): void {
  if (!api.presenting.value) {
    startWithDialog(api, type)
    return
  }
  if (type === 'overview') {
    api.showOverview.value = !api.showOverview.value
    api.showGotoDialog.value = false
    return
  }
  api.showGotoDialog.value = !api.showGotoDialog.value
  api.showOverview.value = false
}

function handleOverviewShortcut(api: PresentationApi): boolean {
  toggleDialog(api, 'overview')
  return true
}

function handleGotoShortcut(api: PresentationApi): boolean {
  toggleDialog(api, 'goto')
  return true
}

function handleDarkShortcut(toggleDark?: () => void): boolean {
  toggleDark?.()
  return true
}

function handlePresentShortcut(api: PresentationApi): boolean {
  if (api.presenting.value) {
    api.stop()
    return true
  }
  api.start(0)
  return true
}

function handleFullscreenShortcut(
  event: KeyboardEvent,
  api: PresentationApi,
  tryToggleFullscreen: () => Promise<void>,
): boolean {
  if (!api.presenting.value) {
    return false
  }
  event.preventDefault()
  if (!event.repeat) {
    void tryToggleFullscreen()
  }
  return true
}

function handleGlobalShortcuts(event: KeyboardEvent, ctx: GlobalHandlerContext): boolean {
  const { api, toggleDark, tryToggleFullscreen } = ctx
  const lower = event.key.toLowerCase()

  if (lower === 'o' || event.key === '`') {
    event.preventDefault()
    return handleOverviewShortcut(api)
  }
  if (lower === 'd') {
    event.preventDefault()
    return handleDarkShortcut(toggleDark)
  }
  if (lower === 'g') {
    event.preventDefault()
    return handleGotoShortcut(api)
  }
  if (lower === 'p') {
    event.preventDefault()
    return handlePresentShortcut(api)
  }
  if (lower === 'f') {
    return handleFullscreenShortcut(event, api, tryToggleFullscreen)
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

type NavigationAction = (api: PresentationApi, event: KeyboardEvent) => void

const NAVIGATION_ACTIONS: Record<string, NavigationAction> = {
  ' ': (api, event) => {
    if (event.shiftKey) {
      api.prev()
      return
    }
    api.next()
  },
  ArrowRight: (api, event) => {
    if (event.shiftKey) {
      api.nextSlide()
      return
    }
    api.next()
  },
  ArrowLeft: (api, event) => {
    if (event.shiftKey) {
      api.prevSlide()
      return
    }
    api.prev()
  },
  ArrowDown: (api) => {
    api.nextSlide()
  },
  ArrowUp: (api) => {
    api.prevSlide()
  },
  PageDown: (api) => {
    api.next()
  },
  PageUp: (api) => {
    api.prev()
  },
}

function handleNavigationKey(event: KeyboardEvent, api: PresentationApi): boolean {
  const action = NAVIGATION_ACTIONS[event.key]
  if (action === undefined) {
    return false
  }
  event.preventDefault()
  action(api, event)
  return true
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
