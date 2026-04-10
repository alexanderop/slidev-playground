import type { Ref } from 'vue'
import { useResizeObserver } from '@vueuse/core'
import { inject, nextTick, ref, watch } from 'vue'
import { PREVIEW_PADDING } from '../constants'
import { slideDimensionsKey } from '../injection-keys'
import type { SlideDimensions } from '../injection-keys'

export function getPreviewSlideScale(
  containerWidth: number,
  slideWidth: number,
  previewPadding = PREVIEW_PADDING,
) {
  const availableWidth = containerWidth - previewPadding
  return Math.max(availableWidth / slideWidth, 0)
}

export function useSlideScale(
  container: Ref<HTMLElement | null>,
  providedDimensions?: SlideDimensions,
) {
  const slideScale = ref(0.4)
  const dimensions = providedDimensions ?? inject(slideDimensionsKey)!

  function updateScale() {
    if (!container.value) {
      return
    }
    slideScale.value = getPreviewSlideScale(
      container.value.clientWidth,
      dimensions.slideWidth.value,
    )
  }

  watch(
    [container, dimensions.slideWidth],
    () => {
      void nextTick(updateScale)
    },
    { immediate: true },
  )

  useResizeObserver(container, updateScale)

  return { slideScale, updateScale }
}
