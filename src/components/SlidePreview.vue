<script setup lang="ts">
import type { RenderedSlide } from '../types'
import { computed, inject } from 'vue'
import { slideDimensionsKey } from '../config/injection-keys'
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
  box-shadow: var(--shell-slide-shadow-hover);
}

.preview-slide-wrapper:hover .slide-number {
  color: var(--shell-text);
}

.preview-slide-wrapper:focus-visible {
  outline: none;
}

.preview-slide-wrapper:focus-visible .preview-slide {
  box-shadow: var(--shell-slide-shadow-hover);
}

.slide-number {
  position: absolute;
  top: 8px;
  left: -28px;
  font-size: 11px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--shell-text-dim);
  width: 24px;
  text-align: right;
  transition: color 0.15s;
}

.preview-slide {
  width: 100%;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: var(--shell-slide-shadow);
  transition: box-shadow 0.2s ease;
  border: 1px solid var(--shell-border);
}

.preview-note-indicator {
  font-size: 10px;
  font-weight: 500;
  color: var(--shell-text-dim);
  padding: 4px 4px 0;
  opacity: 0.6;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
</style>
