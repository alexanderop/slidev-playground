<script setup lang="ts">
import { ref } from 'vue'
import { useClickAnimation } from '../composables/useClickAnimation'

const { slideHtml, currentClick } = defineProps<{
  slideHtml: string
  currentClick: number
}>()

const slideRef = ref<HTMLElement | null>(null)

useClickAnimation(slideRef, () => ({
  currentClick,
  currentSlide: 0,
}))
</script>

<template>
  <div class="present-slide">
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div ref="slideRef" v-html="slideHtml"></div>
  </div>
</template>
