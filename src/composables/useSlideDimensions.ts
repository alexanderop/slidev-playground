import type { ComputedRef } from 'vue'
import { computed, provide } from 'vue'
import { slideDimensionsKey } from '../config/injection-keys'
import type { SlidevConfig } from './useHeadmatter'

const DEFAULT_WIDTH = 960
const DEFAULT_ASPECT_RATIO = 16 / 9

export function useSlideDimensions(config: ComputedRef<SlidevConfig>) {
  const slideWidth = computed(() => config.value.canvasWidth || DEFAULT_WIDTH)

  const slideHeight = computed(() => {
    const ratio = config.value.aspectRatio || DEFAULT_ASPECT_RATIO
    return Math.round(slideWidth.value / ratio)
  })

  provide(slideDimensionsKey, { slideWidth, slideHeight })

  return { slideWidth, slideHeight }
}
