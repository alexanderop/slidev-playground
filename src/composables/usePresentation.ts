import type { Ref } from 'vue'
import { useMagicKeys, whenever } from '@vueuse/core'
import { computed, ref } from 'vue'

export interface SlideInfo {
  transition?: string
  totalClicks?: number
}

function isEditorFocused(): boolean {
  const target = document.activeElement
  if (!(target instanceof HTMLElement)) {
    return false
  }
  return (
    target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || !!target.closest('.cm-editor')
  )
}

export function usePresentation(getSlides: () => SlideInfo[]) {
  const presenting = ref(false)
  const currentSlide = ref(0)
  const currentClick = ref(0)
  const navDirection = ref<'forward' | 'backward'>('forward')
  const previousSlide = ref(0)
  const showNotes = ref(false)
  const showOverview = ref(false)

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
  }

  function next() {
    const slides = getSlides()
    const totalClicks = slides[currentSlide.value]?.totalClicks ?? 0

    if (currentClick.value < totalClicks) {
      currentClick.value++
    } else if (currentSlide.value < slides.length - 1) {
      navDirection.value = 'forward'
      previousSlide.value = currentSlide.value
      currentSlide.value++
      currentClick.value = 0
    }
  }

  function prev() {
    if (currentClick.value > 0) {
      currentClick.value--
    } else if (currentSlide.value > 0) {
      navDirection.value = 'backward'
      previousSlide.value = currentSlide.value
      currentSlide.value--
      const slides = getSlides()
      currentClick.value = slides[currentSlide.value]?.totalClicks ?? 0
    }
  }

  function goToSlide(index: number) {
    previousSlide.value = currentSlide.value
    navDirection.value = index > currentSlide.value ? 'forward' : 'backward'
    currentSlide.value = index
    currentClick.value = 0
    showOverview.value = false
  }

  const keys = useMagicKeys()
  const canNavigate = computed(() => presenting.value && !showOverview.value)

  function whenAny(keysToWatch: Array<Ref<boolean>>, effect: () => void) {
    for (const key of keysToWatch) {
      whenever(key, effect)
    }
  }

  // Overview toggle — works in both modes (but not when typing in editor)
  whenever(keys.o, () => {
    if (isEditorFocused()) {
      return
    }
    if (presenting.value) {
      showOverview.value = !showOverview.value
    } else {
      start(0)
      showOverview.value = true
    }
  })

  // Forward navigation
  whenAny([keys.ArrowRight, keys.ArrowDown, keys.space], () => {
    if (canNavigate.value) {
      next()
    }
  })

  // Backward navigation
  whenAny([keys.ArrowLeft, keys.ArrowUp], () => {
    if (canNavigate.value) {
      prev()
    }
  })

  // Escape — close overview or exit presentation
  whenever(keys.escape, () => {
    if (!presenting.value) {
      return
    }
    if (showOverview.value) {
      showOverview.value = false
    } else {
      stop()
    }
  })

  // Toggle speaker notes
  whenever(keys.n, () => {
    if (presenting.value) {
      showNotes.value = !showNotes.value
    }
  })

  return {
    presenting,
    currentSlide,
    currentClick,
    navDirection,
    transitionName,
    showNotes,
    showOverview,
    start,
    stop,
    next,
    prev,
    goToSlide,
  }
}
