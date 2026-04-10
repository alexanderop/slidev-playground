<script setup lang="ts">
import mermaid from 'mermaid'
import { computed, ref, watchEffect } from 'vue'

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

  try {
    renderCounter += 1
    const { svg: renderedSvg } = await mermaid.render(
      `slidev-mermaid-${renderCounter}`,
      decodedCode.value,
    )
    svg.value = renderedSvg
    renderError.value = ''
  } catch (error) {
    svg.value = ''
    renderError.value = error instanceof Error ? error.message : 'Failed to render Mermaid diagram.'
  }
})
</script>

<template>
  <SlidevErrorBlock v-if="renderError" :message="renderError" />
  <!-- eslint-disable vue/no-v-html -->
  <div v-else class="slidev-mermaid-block" v-html="svg"></div>
  <!-- eslint-enable vue/no-v-html -->
</template>
