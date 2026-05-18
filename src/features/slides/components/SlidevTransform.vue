<script setup lang="ts">
import { computed } from 'vue'

/* eslint-disable vue/require-default-prop -- both props are optional; defaults are applied inline below */
const { scale, origin } = defineProps<{
  scale?: number | string
  origin?: string
}>()
/* eslint-enable vue/require-default-prop */

defineSlots<{
  default?: () => unknown
}>()

const style = computed(() => ({
  transform: scale === undefined ? undefined : `scale(${scale})`,
  transformOrigin: origin ?? 'top left',
}))
</script>

<template>
  <div :style="style">
    <slot></slot>
  </div>
</template>
