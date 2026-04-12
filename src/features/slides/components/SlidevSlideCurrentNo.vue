<script setup lang="ts">
import { computed, inject } from 'vue'
import { currentSlideIndexKey } from '../../../config/injection-keys'

const slideIndex = inject(
  currentSlideIndexKey,
  computed(() => 0),
)
const slideNumber = computed(() => slideIndex.value + 1)
</script>

<template>
  <span>{{ slideNumber }}</span>
</template>
