import { useEventListener, useWindowSize } from '@vueuse/core'
import { ref } from 'vue'
import { SPLIT_MAX_PERCENT, SPLIT_MIN_PERCENT } from '../constants'

export function useSplitPane(onResize?: () => void) {
  const dragging = ref(false)
  const splitPercent = ref(50)
  const { width: windowWidth } = useWindowSize()

  function startDrag() {
    dragging.value = true
  }

  useEventListener('mousemove', (e: MouseEvent) => {
    if (!dragging.value) {
      return
    }
    const pct = (e.clientX / windowWidth.value) * 100
    splitPercent.value = Math.max(SPLIT_MIN_PERCENT, Math.min(SPLIT_MAX_PERCENT, pct))
    onResize?.()
  })

  useEventListener('mouseup', () => {
    dragging.value = false
  })

  return { dragging, splitPercent, startDrag }
}
