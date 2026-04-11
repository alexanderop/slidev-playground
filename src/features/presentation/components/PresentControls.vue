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
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(12px);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  opacity: 0;
  transition: opacity 0.3s;
  z-index: 1001;
}

.present-controls button {
  padding: 5px 14px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.85);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition:
    background 0.15s,
    color 0.15s;
}

.present-controls button:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

.present-controls button:hover:not(:disabled) {
  background: color-mix(in srgb, var(--slidev-theme-primary) 40%, rgba(255, 255, 255, 0.1));
  color: #fff;
}

.slide-counter {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  padding: 0 4px;
}

.click-counter {
  color: rgba(255, 255, 255, 0.3);
  font-size: 11px;
}
</style>
