<script setup lang="ts">
import { computed } from 'vue'

const { scale, origin } = defineProps<{
  scale?: number | string
  origin?: string
}>()

const style = computed(() => ({
  transform: scale === undefined ? undefined : `scale(${scale})`,
  transformOrigin: origin ?? 'top left',
}))
</script>

<template>
  <div :style="style">
    <slot />
  </div>
</template>
