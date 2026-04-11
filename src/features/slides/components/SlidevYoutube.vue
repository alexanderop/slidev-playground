<script setup lang="ts">
import { computed } from 'vue'

const {
  id,
  width = 560,
  height = 315,
} = defineProps<{
  id: string
  width?: number | string
  height?: number | string
}>()

const src = computed(() => `https://www.youtube.com/embed/${id}`)
</script>

<template>
  <iframe
    class="slidev-youtube"
    :src="src"
    :width="width"
    :height="height"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen
  ></iframe>
</template>
