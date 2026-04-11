<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { computed, ref } from 'vue'

const {
  modelValue,
  suggestions,
  placeholder = '',
} = defineProps<{
  modelValue: string
  suggestions: string[]
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const open = ref(false)
const wrapperRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

onClickOutside(wrapperRef, () => {
  open.value = false
})

const filtered = computed(() => {
  const query = modelValue.toLowerCase()
  if (!query) {
    return suggestions
  }
  return suggestions.filter((s) => s.toLowerCase().includes(query))
})

function onInput(e: Event) {
  const value = (e.target as HTMLInputElement).value
  emit('update:modelValue', value)
  open.value = true
}

function select(font: string) {
  emit('update:modelValue', font)
  open.value = false
}

function onFocus() {
  open.value = true
}
</script>

<template>
  <div ref="wrapperRef" class="font-autocomplete">
    <input
      ref="inputRef"
      type="text"
      class="font-input"
      :value="modelValue"
      :placeholder="placeholder"
      @input="onInput"
      @focus="onFocus"
    />
    <ul v-if="open && filtered.length > 0" class="suggestions">
      <li
        v-for="font in filtered"
        :key="font"
        class="suggestion"
        :class="{ active: font === modelValue }"
        @mousedown.prevent="select(font)"
      >
        {{ font }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.font-autocomplete {
  position: relative;
}

.font-input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid var(--shell-border);
  border-radius: 6px;
  background: var(--shell-bg);
  color: var(--shell-text);
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s;
}

.font-input:focus {
  border-color: var(--slidev-theme-primary);
}

.suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 180px;
  overflow-y: auto;
  background: var(--shell-bg-elevated);
  border: 1px solid var(--shell-border);
  border-radius: 6px;
  margin-top: 4px;
  padding: 4px;
  list-style: none;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.suggestion {
  padding: 6px 8px;
  font-size: 13px;
  cursor: pointer;
  color: var(--shell-text);
  border-radius: 4px;
  transition: background 0.1s;
}

.suggestion:hover {
  background: var(--shell-border);
}

.suggestion.active {
  color: var(--slidev-theme-primary);
  font-weight: 500;
}
</style>
