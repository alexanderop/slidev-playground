<script setup lang="ts">
defineProps<{
  controls?: boolean
  autoplay?: boolean
}>()

defineSlots<{
  default?: () => unknown
}>()
</script>

<template>
  <video :controls="controls" :autoplay="autoplay">
    <slot></slot>
  </video>
</template>
