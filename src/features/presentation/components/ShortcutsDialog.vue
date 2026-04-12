<script setup lang="ts">
import { computed } from 'vue'
import { SHORTCUTS_CATALOG } from '../shortcuts-catalog'

const { open } = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const globalShortcuts = computed(() =>
  SHORTCUTS_CATALOG.filter((entry) => entry.scope === 'global'),
)
const presentationShortcuts = computed(() =>
  SHORTCUTS_CATALOG.filter((entry) => entry.scope === 'presentation'),
)

function close() {
  emit('close')
}
</script>

<template>
  <div v-if="open" class="shortcuts-backdrop" @click.self="close">
    <section class="shortcuts-panel" role="dialog" aria-label="Keyboard shortcuts">
      <header class="shortcuts-header">
        <h2 class="shortcuts-title">Keyboard shortcuts</h2>
        <button type="button" class="shortcuts-close" aria-label="Close" @click="close">×</button>
      </header>

      <section class="shortcuts-group" aria-label="Global shortcuts">
        <h3 class="shortcuts-group-title">Global</h3>
        <ul class="shortcuts-list">
          <li v-for="entry in globalShortcuts" :key="entry.description" class="shortcuts-row">
            <span class="shortcuts-keys">
              <kbd v-for="(key, index) in entry.keys" :key="index">{{ key }}</kbd>
            </span>
            <span class="shortcuts-description">{{ entry.description }}</span>
          </li>
        </ul>
      </section>

      <section class="shortcuts-group" aria-label="Presentation shortcuts">
        <h3 class="shortcuts-group-title">Presentation</h3>
        <ul class="shortcuts-list">
          <li v-for="entry in presentationShortcuts" :key="entry.description" class="shortcuts-row">
            <span class="shortcuts-keys">
              <kbd v-for="(key, index) in entry.keys" :key="index">{{ key }}</kbd>
            </span>
            <span class="shortcuts-description">{{ entry.description }}</span>
          </li>
        </ul>
      </section>
    </section>
  </div>
</template>

<style scoped>
.shortcuts-backdrop {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1002;
  pointer-events: auto;
}

.shortcuts-panel {
  width: min(560px, 100%);
  max-height: calc(100vh - 40px);
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 24px;
  border-radius: 12px;
  background: rgba(22, 24, 29, 0.96);
  color: #f5f7fa;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(12px);
}

.shortcuts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.shortcuts-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.shortcuts-close {
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}

.shortcuts-close:hover {
  background: rgba(255, 255, 255, 0.08);
}

.shortcuts-group-title {
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(245, 247, 250, 0.6);
}

.shortcuts-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.shortcuts-row {
  display: grid;
  grid-template-columns: 160px 1fr;
  align-items: center;
  gap: 12px;
  padding: 6px 8px;
  border-radius: 6px;
}

.shortcuts-row:hover {
  background: rgba(255, 255, 255, 0.04);
}

.shortcuts-keys {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.shortcuts-keys kbd {
  display: inline-block;
  padding: 2px 6px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-bottom-width: 2px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.06);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  color: inherit;
}

.shortcuts-description {
  font-size: 13px;
  color: rgba(245, 247, 250, 0.86);
}
</style>
