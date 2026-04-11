<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  id: string
  width?: number | string
  height?: number | string
}>()

const src = computed(() => `https://www.youtube.com/embed/${props.id}`)
</script>

<template>
  <iframe
    class="slidev-youtube"
    :src="src"
    :width="width ?? 560"
    :height="height ?? 315"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen
  />
</template>
