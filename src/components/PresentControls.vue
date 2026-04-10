<script setup lang="ts">
defineProps<{
  currentSlide: number
  totalSlides: number
  currentClick: number
  totalClicks: number
  canGoPrev: boolean
  canGoNext: boolean
}>()

defineEmits<{
  prev: []
  next: []
  exit: []
}>()
</script>

<template>
  <div class="present-controls">
    <span class="slide-counter">
      {{ currentSlide + 1 }} / {{ totalSlides }}
      <span v-if="totalClicks > 0" class="click-counter"
        >({{ currentClick }}/{{ totalClicks }})</span
      >
    </span>
    <button :disabled="!canGoPrev" @click="$emit('prev')">Prev</button>
    <button :disabled="!canGoNext" @click="$emit('next')">Next</button>
    <button @click="$emit('exit')">Exit</button>
  </div>
</template>

<style scoped>
.present-controls {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  opacity: 0;
  transition: opacity 0.3s;
  z-index: 1001;
}

.present-controls button {
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.present-controls button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.present-controls button:hover:not(:disabled) {
  background: color-mix(in srgb, var(--slidev-theme-primary) 35%, rgba(255, 255, 255, 0.15));
}

.slide-counter {
  color: #aaa;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.click-counter {
  color: #777;
  font-size: 11px;
}
</style>
