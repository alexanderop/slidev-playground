<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { tryRunAsync } from '../../../utils/try-run'

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

  const [fetchError, response] = await tryRunAsync(
    fetch(`https://api.iconify.design/${collection}/${name}.svg`),
  )
  if (fetchError || !response || !response.ok) {
    svgContent.value = ''
    return
  }
  const [textError, svg] = await tryRunAsync(response.text())
  if (textError || svg === undefined) {
    svgContent.value = ''
    return
  }
  cache.set(key, svg)
  svgContent.value = svg
})
</script>

<template>
  <!-- eslint-disable vue/no-v-html -->
  <span class="slidev-icon" v-html="svgContent"></span>
  <!-- eslint-enable vue/no-v-html -->
</template>
