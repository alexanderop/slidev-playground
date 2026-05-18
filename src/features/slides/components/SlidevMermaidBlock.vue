<script setup lang="ts">
import mermaid from 'mermaid'
import { computed, ref, watchEffect } from 'vue'
import { errorMessage, tryRunAsync } from '../../../utils/try-run'

const { code } = defineProps<{
  code: string
}>()

const svg = ref('')
const renderError = ref('')
let mermaidInitialized = false
let renderCounter = 0

const decodedCode = computed(() => decodeURIComponent(code))

watchEffect(async () => {
  if (!mermaidInitialized) {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      theme: 'neutral',
    })
    mermaidInitialized = true
  }

  renderCounter += 1
  const [error, result] = await tryRunAsync(
    mermaid.render(`slidev-mermaid-${renderCounter}`, decodedCode.value),
  )
  if (error || !result) {
    svg.value = ''
    renderError.value = errorMessage(error, 'Failed to render Mermaid diagram.')
    return
  }
  svg.value = result.svg
  renderError.value = ''
})
</script>

<template>
  <SlidevErrorBlock v-if="renderError" :message="renderError" />
  <!-- eslint-disable vue/no-v-html -->
  <div v-else class="slidev-mermaid-block" v-html="svg"></div>
  <!-- eslint-enable vue/no-v-html -->
</template>
