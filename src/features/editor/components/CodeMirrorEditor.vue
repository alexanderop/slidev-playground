<script setup lang="ts">
import type { EditorView } from '@codemirror/view'
import { toRef, useTemplateRef, watch } from 'vue'
import { useCodeMirror } from '../composables/useCodeMirror'

const { modelValue } = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editorView = defineModel<EditorView | null>('editorView', { required: true })
const editorContainer = useTemplateRef<HTMLElement>('editorContainer')

const { view, vimEnabled, vimMode, toggleVim } = useCodeMirror(
  editorContainer,
  toRef(() => modelValue),
  (value) => emit('update:modelValue', value),
)

watch(
  view,
  (value) => {
    editorView.value = value
  },
  { immediate: true },
)
</script>

<template>
  <div class="cm-editor-wrapper">
    <div ref="editorContainer" class="editor-host"></div>

    <div
      v-if="vimEnabled"
      role="status"
      aria-live="polite"
      class="mode-badge"
      :class="`mode-${vimMode}`"
    >
      -- {{ vimMode.toUpperCase() }} --
    </div>

    <button
      type="button"
      class="vim-toggle"
      :class="{ enabled: vimEnabled }"
      :aria-pressed="vimEnabled"
      aria-label="Vim mode"
      @click="toggleVim"
    >
      <span class="dot"></span>
      VIM
    </button>
  </div>
</template>

<style scoped>
.cm-editor-wrapper {
  height: 100%;
  overflow: hidden;
  background: var(--shell-editor-bg);
  position: relative;
}

.editor-host {
  height: 100%;
}

.cm-editor-wrapper :deep(.cm-editor) {
  height: 100%;
}

.mode-badge {
  position: absolute;
  top: 8px;
  left: 12px;
  z-index: 10;
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 4px 10px;
  border-radius: 4px;
  pointer-events: none;
  background: color-mix(in srgb, currentColor 14%, var(--shell-bg-surface));
  border: 1px solid currentColor;
  backdrop-filter: blur(4px);
}

.mode-normal {
  color: #a6e3a1;
}
.mode-insert {
  color: #fab387;
}
.mode-visual {
  color: #cba6f7;
}
.mode-replace {
  color: #f38ba8;
}

.vim-toggle {
  position: absolute;
  top: 8px;
  right: 12px;
  z-index: 10;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  font-family: inherit;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--shell-text-dim);
  background: color-mix(in srgb, var(--shell-bg-surface) 80%, transparent);
  border: 1px solid var(--shell-border);
  border-radius: 999px;
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition:
    color 0.15s,
    border-color 0.15s,
    background 0.15s;
}

.vim-toggle:hover {
  color: var(--shell-text);
  border-color: var(--shell-border-active);
}

.vim-toggle.enabled {
  color: #a6e3a1;
  border-color: #a6e3a1;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.6;
}

.vim-toggle.enabled .dot {
  opacity: 1;
  box-shadow: 0 0 6px currentColor;
}
</style>
