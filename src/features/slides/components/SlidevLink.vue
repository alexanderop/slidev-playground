<script setup lang="ts">
import { inject } from 'vue'
import { defaultSlidevNav, slidevNavKey } from '../../../config/injection-keys'

const { to } = defineProps<{
  to: number | string
}>()

const nav = inject(slidevNavKey, defaultSlidevNav)

function handleClick(event: Event) {
  event.preventDefault()
  const slideIndex = typeof to === 'string' ? parseInt(to, 10) - 1 : to - 1
  if (slideIndex >= 0) {
    nav.goToSlide(slideIndex)
  }
}
</script>

<template>
  <a href="#" @click="handleClick">
    <slot />
  </a>
</template>
