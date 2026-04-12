<script setup lang="ts">
defineProps<{
  controls?: boolean
  autoplay?: boolean
}>()
</script>

<template>
  <video :controls="controls" :autoplay="autoplay">
    <slot />
  </video>
</template>
