<script setup lang="ts">
import { computed } from 'vue'

const {
  x1,
  y1,
  x2,
  y2,
  width = 2,
  color = 'currentColor',
} = defineProps<{
  x1: number | string
  y1: number | string
  x2: number | string
  y2: number | string
  width?: number | string
  color?: string
}>()

const markerId = computed(() => `arrow-${x1}-${y1}-${x2}-${y2}`)
const svgWidth = computed(() => Math.max(+x1, +x2) + 50)
const svgHeight = computed(() => Math.max(+y1, +y2) + 50)
</script>

<template>
  <svg class="slidev-arrow absolute left-0 top-0" :width="svgWidth" :height="svgHeight">
    <defs>
      <marker
        :id="markerId"
        markerWidth="10"
        markerHeight="7"
        refX="9"
        refY="3.5"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <polygon points="0 0, 10 3.5, 0 7" :fill="color" />
      </marker>
    </defs>
    <line
      :x1="x1"
      :y1="y1"
      :x2="x2"
      :y2="y2"
      :stroke="color"
      :stroke-width="width"
      :marker-end="`url(#${markerId})`"
    />
  </svg>
</template>
