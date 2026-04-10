<script setup lang="ts">
import type { RenderedSlide } from '../types'
import { computed, inject } from 'vue'
import { slideDimensionsKey } from '../injection-keys'
import SlideSurface from './SlideSurface.vue'

defineProps<{
  slide: RenderedSlide
  slideNumber: number
  slideIndex: number
  slideScale: number
}>()

defineEmits<{
  select: []
}>()

const dimensions = inject(slideDimensionsKey)!
const aspectRatio = computed(
  () => `${dimensions.slideWidth.value} / ${dimensions.slideHeight.value}`,
)
</script>

<template>
  <!-- eslint-disable vue/no-v-html -->
  <button
    type="button"
    class="preview-slide-wrapper"
    :data-slide-index="slideIndex"
    :aria-label="`Open slide ${slideNumber} in presentation`"
    @click="$emit('select')"
  >
    <div class="slide-number">
      {{ slideNumber }}
    </div>
    <div class="preview-slide" :style="{ aspectRatio }">
      <SlideSurface :slide="slide" :scale="slideScale" />
    </div>
    <div v-if="slide.note" class="preview-note-indicator">Notes</div>
  </button>
  <!-- eslint-enable vue/no-v-html -->
</template>

<style scoped>
.preview-slide-wrapper {
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
  display: block;
  width: 100%;
  background: none;
  border: 0;
  padding: 0;
  text-align: left;
}

.preview-slide-wrapper:hover .preview-slide {
  box-shadow: 0 0 0 2px var(--slidev-theme-primary);
}

.preview-slide-wrapper:focus-visible {
  outline: 2px solid var(--slidev-theme-primary);
  outline-offset: 4px;
}

.slide-number {
  position: absolute;
  top: 8px;
  left: -28px;
  font-size: 12px;
  color: var(--shell-text-dim);
  width: 24px;
  text-align: right;
}

.preview-slide {
  width: 100%;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
  transition: box-shadow 0.15s;
}

.preview-note-indicator {
  font-size: 11px;
  color: var(--shell-text-dim);
  padding: 2px 8px;
  opacity: 0.6;
}
</style>
