<script setup lang="ts">
import { computed, inject } from 'vue'
import { slideDimensionsKey } from '../config/injection-keys'
import type { RenderedSlide } from '../types'
import ScopedSlideStyles from './ScopedSlideStyles.vue'
import SlideLayoutHost from './SlideLayoutHost'

const { slide, scale } = defineProps<{
  slide: RenderedSlide
  scale: number | string
}>()

const dimensions = inject(slideDimensionsKey)!

const contentStyle = computed(() => {
  const base: Record<string, string> = {
    '--slidev-slide-scale': String(scale),
    height: `${dimensions.slideHeight.value}px`,
    width: `${dimensions.slideWidth.value}px`,
  }

  const bg = slide.background
  const imageBackground = slide.backgroundImage || slide.image
  if (imageBackground) {
    base.backgroundImage = `url(${imageBackground})`
    base.backgroundSize = 'cover'
    base.backgroundPosition = 'center'
    return base
  }

  if (bg) {
    const isImage =
      /^(https?:|\/|\.\/|data:)/.test(bg) || /\.(png|jpe?g|gif|svg|webp|avif)/i.test(bg)
    if (isImage) {
      base.backgroundImage = `url(${bg})`
      base.backgroundSize = 'cover'
      base.backgroundPosition = 'center'
    }
    if (!isImage) {
      base.background = bg
    }
  }

  return base
})

const scopedStyles = computed(() => slide.scopedStyles ?? '')
</script>

<template>
  <div class="slidev-slide-container">
    <div :id="slide.scopeId" class="slidev-slide-content" :style="contentStyle">
      <SlideLayoutHost :slide="slide" />
      <ScopedSlideStyles v-if="scopedStyles" :css="scopedStyles" />
    </div>
  </div>
</template>
