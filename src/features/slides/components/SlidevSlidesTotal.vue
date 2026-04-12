<script setup lang="ts">
import { computed, inject } from 'vue'
import { totalSlidesKey } from '../../../config/injection-keys'

const total = inject(
  totalSlidesKey,
  computed(() => 0),
)
</script>

<template>
  <span>{{ total }}</span>
</template>
