<script setup lang="ts">
import { computed, inject } from 'vue'
import { effectiveModeKey } from '../../../config/injection-keys'

defineSlots<{
  dark?: () => unknown
  light?: () => unknown
}>()

const mode = inject(
  effectiveModeKey,
  computed(() => 'light' as const),
)
const isDark = computed(() => mode.value === 'dark')
</script>

<template>
  <slot v-if="isDark" name="dark"></slot>
  <slot v-else name="light"></slot>
</template>
