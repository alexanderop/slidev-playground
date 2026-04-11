import type { Ref } from 'vue'
import { nextTick, watch } from 'vue'

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
      element.classList.toggle('v-click-hidden', step > currentClick)
      element.classList.toggle('v-click-visible', step <= currentClick)
    })
  }

  watch(
    () => getState(),
    async () => {
      await nextTick()
      applyClickState()
      setTimeout(applyClickState, 350)
    },
    { immediate: true },
  )

  return { applyClickState }
}
