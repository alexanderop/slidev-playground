<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const { errors } = defineProps<{
  errors: readonly string[]
}>()

const dismissed = ref(false)

watch(
  () => errors,
  () => {
    dismissed.value = false
  },
)

const visible = computed(() => errors.length > 0 && !dismissed.value)
const primary = computed(() => errors[0] ?? '')
const extraCount = computed(() => Math.max(0, errors.length - 1))
</script>

<template>
  <Transition name="overlay-fade">
    <div v-if="visible" class="editor-error-overlay" role="alert">
      <pre class="message">{{ primary }}</pre>
      <span v-if="extraCount > 0" class="extra">+{{ extraCount }} more</span>
      <button type="button" class="dismiss" aria-label="Dismiss error" @click="dismissed = true">
        &times;
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.editor-error-overlay {
  position: absolute;
  bottom: 8px;
  left: 8px;
  right: 8px;
  z-index: 20;
  border: 1px solid #f56c6c;
  background: color-mix(in srgb, #f56c6c 12%, var(--shell-bg-surface));
  color: #f56c6c;
  border-radius: 6px;
  font-family: var(--font-mono, monospace);
  display: flex;
  align-items: stretch;
  gap: 8px;
  max-height: calc(100% - 80px);
  min-height: 40px;
}

.message {
  margin: 0;
  padding: 10px 16px;
  flex: 1;
  overflow: auto;
  white-space: pre-wrap;
  font-size: 12px;
  line-height: 1.5;
}

.extra {
  align-self: flex-start;
  padding: 10px 8px;
  font-size: 11px;
  opacity: 0.75;
  font-family: var(--font-sans, system-ui);
}

.dismiss {
  align-self: flex-start;
  width: 22px;
  height: 22px;
  margin: 6px 6px 0 0;
  border: none;
  border-radius: 11px;
  background: #f56c6c;
  color: white;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.dismiss:hover {
  background: color-mix(in srgb, #f56c6c 85%, black);
}

.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition:
    opacity 0.15s ease-out,
    transform 0.15s ease-out;
}

.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
