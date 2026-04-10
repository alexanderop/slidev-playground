<script setup lang="ts">
import type { RenderedSlide } from '../types'
import { computed, inject } from 'vue'
import { slideDimensionsKey } from '../injection-keys'
import SlideSurface from './SlideSurface.vue'

defineProps<{
  slides: RenderedSlide[]
  currentSlide: number
}>()

defineEmits<{
  select: [index: number]
  close: []
}>()

const dimensions = inject(slideDimensionsKey)!
const overviewScale = computed(() => 192 / dimensions.slideWidth.value)
const aspectRatio = computed(
  () => `${dimensions.slideWidth.value} / ${dimensions.slideHeight.value}`,
)
</script>

<template>
  <!-- eslint-disable vue/no-v-html -->
  <div
    class="overview-overlay"
    role="dialog"
    aria-label="Slide overview"
    @click.self="$emit('close')"
  >
    <div class="overview-grid">
      <button
        v-for="(slide, index) in slides"
        :key="index"
        type="button"
        class="overview-item"
        :aria-label="`Jump to slide ${index + 1}`"
        :class="{ active: index === currentSlide }"
        @click="$emit('select', index)"
      >
        <div class="overview-slide" :style="{ aspectRatio }">
          <SlideSurface :slide="slide" :scale="overviewScale" />
        </div>
        <span class="overview-number">{{ index + 1 }}</span>
      </button>
    </div>
  </div>
  <!-- eslint-enable vue/no-v-html -->
</template>

<style scoped>
.overview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.92);
  z-index: 1003;
  overflow-y: auto;
  padding: 40px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  max-width: 1200px;
  width: 100%;
}

.overview-item {
  cursor: pointer;
  border-radius: 6px;
  overflow: hidden;
  border: 2px solid transparent;
  padding: 0;
  text-align: left;
  transition: border-color 0.15s;
  background: rgba(255, 255, 255, 0.05);
}

.overview-item:hover {
  border-color: var(--slidev-theme-primary);
}

.overview-item:focus-visible {
  outline: 2px solid var(--slidev-theme-primary);
  outline-offset: 4px;
}

.overview-item.active {
  border-color: var(--slidev-theme-primary);
  box-shadow: 0 0 0 2px var(--slidev-theme-primary);
}

.overview-slide {
  width: 100%;
  overflow: hidden;
  position: relative;
}

.overview-number {
  display: block;
  text-align: center;
  font-size: 12px;
  color: var(--shell-text-dim);
  padding: 4px;
}
</style>
