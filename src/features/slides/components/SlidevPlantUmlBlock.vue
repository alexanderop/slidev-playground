<script setup lang="ts">
import plantumlEncoder from 'plantuml-encoder'
import { computed } from 'vue'

const { code } = defineProps<{
  code: string
}>()

const decodedCode = computed(() => decodeURIComponent(code))
const src = computed(() => {
  const encoded = plantumlEncoder.encode(decodedCode.value)
  return `https://www.plantuml.com/plantuml/svg/${encoded}`
})
</script>

<template>
  <div class="slidev-plantuml-block">
    <img :src="src" alt="PlantUML diagram" />
  </div>
</template>
