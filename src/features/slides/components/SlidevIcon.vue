<script setup lang="ts">
import { ref, watchEffect } from 'vue'

const { collection, name } = defineProps<{
  collection: string
  name: string
}>()

const svgContent = ref('')

const cache = new Map<string, string>()

watchEffect(async () => {
  const key = `${collection}:${name}`
  const cached = cache.get(key)
  if (cached) {
    svgContent.value = cached
    return
  }

  try {
    const response = await fetch(`https://api.iconify.design/${collection}/${name}.svg`)
    if (response.ok) {
      const svg = await response.text()
      cache.set(key, svg)
      svgContent.value = svg
    }
  } catch {
    svgContent.value = ''
  }
})
</script>

<template>
  <!-- eslint-disable vue/no-v-html -->
  <span class="slidev-icon" v-html="svgContent"></span>
  <!-- eslint-enable vue/no-v-html -->
</template>
