<script setup lang="ts">
import type { EditorView } from '@codemirror/view'
import { ref, toRef, watch } from 'vue'
import { useCodeMirror } from '../composables/useCodeMirror'

const { modelValue } = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editorView = defineModel<EditorView | null>('editorView', { required: true })
const editorContainer = ref<HTMLElement | null>(null)

const { view } = useCodeMirror(
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
  <div ref="editorContainer" class="cm-editor-wrapper"></div>
</template>

<style scoped>
.cm-editor-wrapper {
  height: 100%;
  overflow: hidden;
  background: var(--shell-editor-bg);
}

.cm-editor-wrapper :deep(.cm-editor) {
  height: 100%;
}
</style>
