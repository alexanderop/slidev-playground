<script setup lang="ts">
defineProps<{
  noteHtml: string
}>()
</script>

<template>
  <div class="present-notes" role="region" aria-label="Speaker Notes">
    <div class="notes-header">Speaker Notes <span class="notes-key">N</span></div>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div class="notes-content slide-content-notes" v-html="noteHtml"></div>
  </div>
</template>

<style scoped>
.present-notes {
  position: fixed;
  bottom: 60px;
  left: 50%;
  transform: translateX(-50%);
  width: min(600px, 80vw);
  max-height: 200px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  padding: 12px 16px;
  z-index: 1002;
  color: #ccc;
  font-size: 14px;
  line-height: 1.5;
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
