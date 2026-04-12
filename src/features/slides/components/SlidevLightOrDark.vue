<script setup lang="ts">
import { computed, inject } from 'vue'
import { effectiveModeKey } from '../../../config/injection-keys'

const mode = inject(
  effectiveModeKey,
  computed(() => 'light' as const),
)
const isDark = computed(() => mode.value === 'dark')
</script>

<template>
  <slot v-if="isDark" name="dark" />
  <slot v-else name="light" />
</template>
