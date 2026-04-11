<script setup lang="ts">
import type { RenderedSlide } from '../../../types'
import { computed, inject } from 'vue'
import { slideDimensionsKey } from '../../../config/injection-keys'
import SlideSurface from '../../../components/SlideSurface.vue'

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
  backdrop-filter: blur(4px);
  z-index: 1003;
  overflow-y: auto;
  padding: 48px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  max-width: 1200px;
  width: 100%;
}

.overview-item {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid transparent;
  padding: 0;
  text-align: left;
  transition:
    border-color 0.15s,
    transform 0.15s,
    box-shadow 0.15s;
  background: rgba(255, 255, 255, 0.04);
}

.overview-item:hover {
  border-color: var(--slidev-theme-primary);
  transform: translateY(-2px);
}

.overview-item:focus-visible {
  outline: none;
  border-color: var(--slidev-theme-primary);
}

.overview-item.active {
  border-color: var(--slidev-theme-primary);
}

.overview-slide {
  width: 100%;
  overflow: hidden;
  position: relative;
}

.overview-number {
  display: block;
  text-align: center;
  font-size: 11px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: rgba(255, 255, 255, 0.4);
  padding: 6px 4px;
}
</style>
