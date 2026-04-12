import type { Ref } from 'vue'
import { nextTick, onScopeDispose, watch } from 'vue'

// Matches slide click transition duration
const CLICK_TRANSITION_MS = 350

type ClickVisibilityInput = {
  currentClick: number
  step: number
  endRaw: string | undefined
  isHide: boolean
}

function computeClickVisible({
  currentClick,
  step,
  endRaw,
  isHide,
}: ClickVisibilityInput): boolean {
  if (endRaw !== undefined && endRaw !== '') {
    const end = parseInt(endRaw, 10)
    return currentClick >= step && currentClick < end
  }
  if (isHide) {
    return currentClick < step
  }
  return currentClick >= step
}

export function useClickAnimation(
  slideRef: Ref<HTMLElement | null>,
  getState: () => {
    currentClick: number
    currentSlide: number
  },
) {
  function applyClickState() {
    if (!slideRef.value) {
      return
    }

    const { currentClick } = getState()

    const clickElements = slideRef.value.querySelectorAll<HTMLElement>('[data-v-click]')
    clickElements.forEach((element) => {
      const step = parseInt(element.dataset.vClick ?? '0', 10)
      const endRaw = element.dataset.vClickEnd
      const isHide = element.dataset.vClickHide === 'true'

      const visible = computeClickVisible({ currentClick, step, endRaw, isHide })

      element.classList.toggle('v-click-visible', visible)
      element.classList.toggle('v-click-hidden', !visible)
    })

    const switchContainers = slideRef.value.querySelectorAll<HTMLElement>('[data-v-switch-count]')
    switchContainers.forEach((container) => {
      const items = container.querySelectorAll<HTMLElement>('[data-v-switch]')
      items.forEach((item) => {
        const step = parseInt(item.dataset.vSwitch ?? '0', 10)
        const isActive = step === currentClick
        item.classList.toggle('v-click-visible', isActive)
        item.classList.toggle('v-click-hidden', !isActive)
      })
    })
  }

  let pendingTimer: ReturnType<typeof setTimeout> | null = null

  watch(
    () => getState(),
    async () => {
      await nextTick()
      applyClickState()
      if (pendingTimer !== null) {
        clearTimeout(pendingTimer)
      }
      pendingTimer = setTimeout(() => {
        pendingTimer = null
        applyClickState()
      }, CLICK_TRANSITION_MS)
    },
    { immediate: true },
  )

  onScopeDispose(() => {
    if (pendingTimer !== null) {
      clearTimeout(pendingTimer)
      pendingTimer = null
    }
  })

  return { applyClickState }
}
