import type { ComputedRef, Ref } from 'vue'
import { useEventListener } from '@vueuse/core'
import { computed, ref } from 'vue'

export type SlideInfo = {
  readonly transition?: string
  readonly totalClicks?: number
}

type PresentationOptions = {
  toggleDark?: () => void
  toggleFullscreen?: () => Promise<void>
}

export type UsePresentationApi = {
  readonly presenting: Ref<boolean>
  readonly currentSlide: Ref<number>
  readonly currentClick: Ref<number>
  readonly navDirection: Ref<'forward' | 'backward'>
  readonly transitionName: ComputedRef<string>
  readonly showNotes: Ref<boolean>
  readonly showOverview: Ref<boolean>
  readonly showGotoDialog: Ref<boolean>
  readonly showShortcutsDialog: Ref<boolean>
  start: (slideIndex?: number) => void
  stop: () => void
  next: () => void
  prev: () => void
  nextSlide: () => void
  prevSlide: (lastClicks?: boolean) => void
  goToSlide: (index: number) => void
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

export function usePresentation(
  getSlides: () => readonly SlideInfo[],
  options: PresentationOptions = {},
): UsePresentationApi {
  const { toggleDark, toggleFullscreen } = options
  const presenting = ref(false)
  const currentSlide = ref(0)
  const currentClick = ref(0)
  const navDirection = ref<'forward' | 'backward'>('forward')
  const previousSlide = ref(0)
  const showNotes = ref(false)
  const showOverview = ref(false)
  const showGotoDialog = ref(false)
  const showShortcutsDialog = ref(false)

  const transitionName = computed(() => {
    const slides = getSlides()
    if (navDirection.value === 'forward') {
      const from = slides[previousSlide.value]
      return from?.transition ?? 'slide-left'
    }
    const to = slides[currentSlide.value]
    return to?.transition ?? 'slide-right'
  })

  function start(slideIndex = 0) {
    currentSlide.value = slideIndex
    currentClick.value = 0
    presenting.value = true
  }

  function stop() {
    presenting.value = false
    showOverview.value = false
    showNotes.value = false
    showGotoDialog.value = false
    showShortcutsDialog.value = false
  }

  function next() {
    const slides = getSlides()
    const totalClicks = slides[currentSlide.value]?.totalClicks ?? 0

    if (currentClick.value < totalClicks) {
      currentClick.value++
      return
    }

    if (currentSlide.value < slides.length - 1) {
      navDirection.value = 'forward'
      previousSlide.value = currentSlide.value
      currentSlide.value++
      currentClick.value = 0
    }
  }

  function prev() {
    if (currentClick.value > 0) {
      currentClick.value--
      return
    }

    if (currentSlide.value > 0) {
      navDirection.value = 'backward'
      previousSlide.value = currentSlide.value
      currentSlide.value--
      const slides = getSlides()
      currentClick.value = slides[currentSlide.value]?.totalClicks ?? 0
    }
  }

  function nextSlide() {
    const slides = getSlides()
    if (currentSlide.value < slides.length - 1) {
      navDirection.value = 'forward'
      previousSlide.value = currentSlide.value
      currentSlide.value++
      currentClick.value = 0
    }
  }

  function prevSlide(lastClicks = false) {
    if (currentSlide.value > 0) {
      navDirection.value = 'backward'
      previousSlide.value = currentSlide.value
      currentSlide.value--
      const slides = getSlides()
      currentClick.value = lastClicks ? (slides[currentSlide.value]?.totalClicks ?? 0) : 0
    }
  }

  function goToSlide(index: number) {
    previousSlide.value = currentSlide.value
    navDirection.value = index > currentSlide.value ? 'forward' : 'backward'
    currentSlide.value = index
    currentClick.value = 0
    showOverview.value = false
    showGotoDialog.value = false
  }

  function startWithDialog(type: 'overview' | 'goto') {
    if (!presenting.value) {
      start(0)
    }
    if (type === 'overview') {
      showOverview.value = true
      showGotoDialog.value = false
      return
    }
    showGotoDialog.value = true
    showOverview.value = false
  }

  async function tryToggleFullscreen() {
    if (!toggleFullscreen || !presenting.value) {
      return
    }

    await toggleFullscreen()
  }

  type NavigationAction = (event: KeyboardEvent) => void
  const NAVIGATION_ACTIONS: Record<string, NavigationAction> = {
    ' ': (event) => {
      if (event.shiftKey) {
        prev()
        return
      }
      next()
    },
    ArrowRight: (event) => {
      if (event.shiftKey) {
        nextSlide()
        return
      }
      next()
    },
    ArrowLeft: (event) => {
      if (event.shiftKey) {
        prevSlide()
        return
      }
      prev()
    },
    ArrowDown: () => {
      nextSlide()
    },
    ArrowUp: () => {
      prevSlide()
    },
    PageDown: () => {
      next()
    },
    PageUp: () => {
      prev()
    },
  }

  function handleOverviewKey(event: KeyboardEvent): true {
    event.preventDefault()
    if (!presenting.value) {
      startWithDialog('overview')
      return true
    }
    showOverview.value = !showOverview.value
    showGotoDialog.value = false
    return true
  }

  function handleGotoKey(event: KeyboardEvent): true {
    event.preventDefault()
    if (!presenting.value) {
      startWithDialog('goto')
      return true
    }
    showGotoDialog.value = !showGotoDialog.value
    showOverview.value = false
    return true
  }

  function handlePresentKey(event: KeyboardEvent): true {
    event.preventDefault()
    if (presenting.value) {
      stop()
      return true
    }
    start(0)
    return true
  }

  function handleFullscreenKey(event: KeyboardEvent): boolean {
    if (!presenting.value) {
      return true
    }
    event.preventDefault()
    if (!event.repeat) {
      void tryToggleFullscreen()
    }
    return true
  }

  function handleDialogToggleKey(event: KeyboardEvent): boolean {
    const key = event.key
    if (key === '?') {
      event.preventDefault()
      showShortcutsDialog.value = !showShortcutsDialog.value
      return true
    }
    if (key === 'Escape' && showShortcutsDialog.value) {
      event.preventDefault()
      showShortcutsDialog.value = false
      return true
    }
    return false
  }

  function handleGlobalKey(event: KeyboardEvent): boolean {
    const key = event.key
    const lower = key.toLowerCase()
    if (lower === 'o' || key === '`') {
      return handleOverviewKey(event)
    }
    if (lower === 'd') {
      event.preventDefault()
      toggleDark?.()
      return true
    }
    if (lower === 'g') {
      return handleGotoKey(event)
    }
    if (lower === 'p') {
      return handlePresentKey(event)
    }
    if (handleDialogToggleKey(event)) {
      return true
    }
    if (lower === 'f') {
      return handleFullscreenKey(event)
    }
    return false
  }

  function handleEscapeInPresentation(event: KeyboardEvent): true {
    event.preventDefault()
    if (showShortcutsDialog.value) {
      showShortcutsDialog.value = false
      return true
    }
    if (showGotoDialog.value) {
      showGotoDialog.value = false
      return true
    }
    if (showOverview.value) {
      showOverview.value = false
      return true
    }
    stop()
    return true
  }

  function handlePresentationKey(event: KeyboardEvent): void {
    const key = event.key
    if (key === 'Escape') {
      handleEscapeInPresentation(event)
      return
    }
    if (key.toLowerCase() === 'n') {
      event.preventDefault()
      showNotes.value = !showNotes.value
      return
    }
    if (showGotoDialog.value || showOverview.value || showShortcutsDialog.value) {
      return
    }
    const action = NAVIGATION_ACTIONS[key]
    if (action !== undefined) {
      event.preventDefault()
      action(event)
    }
  }

  if (typeof window !== 'undefined') {
    useEventListener(window, 'keydown', (event: KeyboardEvent) => {
      if (isShortcutBlocked()) {
        return
      }
      if (handleGlobalKey(event)) {
        return
      }
      if (!presenting.value) {
        return
      }
      handlePresentationKey(event)
    })
  }

  return {
    presenting,
    currentSlide,
    currentClick,
    navDirection,
    transitionName,
    showNotes,
    showOverview,
    showGotoDialog,
    showShortcutsDialog,
    start,
    stop,
    next,
    prev,
    nextSlide,
    prevSlide,
    goToSlide,
  }
}
