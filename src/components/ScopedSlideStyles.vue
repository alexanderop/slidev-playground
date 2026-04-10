<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'

const { css } = defineProps<{
  css: string
}>()

const styleElement = document.createElement('style')
styleElement.dataset.slidevScopedStyle = 'true'
document.head.append(styleElement)

watch(
  () => css,
  (value) => {
    styleElement.textContent = value
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  styleElement.remove()
})
</script>

<template>
  <span class="sr-only"></span>
</template>
