<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  noteHtml: string
  currentClick?: number
}>()

const visibleHtml = computed(() => {
  const html = props.noteHtml
  const click = props.currentClick ?? 0

  if (!html.includes('[click')) {
    return html
  }

  const segments = html.split(/\[click(?::(\d+))?\]/)
  let result = segments[0]
  let clickCounter = 0

  for (let i = 1; i < segments.length; i += 2) {
    const skip = segments[i] === undefined ? 1 : Number.parseInt(segments[i], 10)
    clickCounter += skip
    const content = segments[i + 1] ?? ''
    if (clickCounter <= click) {
      result += content
    }
  }

  return result
})
</script>

<template>
  <div class="present-notes" role="region" aria-label="Speaker Notes">
    <div class="notes-header">Speaker Notes <span class="notes-key">N</span></div>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div class="notes-content slide-content-notes" v-html="visibleHtml"></div>
  </div>
</template>

<style scoped>
.present-notes {
  position: fixed;
  bottom: 64px;
  left: 50%;
  transform: translateX(-50%);
  width: min(600px, 80vw);
  max-height: 200px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.82);
  backdrop-filter: blur(12px);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 12px 16px;
  z-index: 1002;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  line-height: 1.6;
}

.notes-header {
  font-size: 11px;
  text-transform: uppercase;
  color: #888;
  margin-bottom: 8px;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  gap: 6px;
}

.notes-key {
  background: rgba(255, 255, 255, 0.15);
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 10px;
}
</style>
