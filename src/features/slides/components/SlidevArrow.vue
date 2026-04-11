<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    x1: number | string
    y1: number | string
    x2: number | string
    y2: number | string
    width?: number | string
    color?: string
  }>(),
  {
    width: 2,
    color: 'currentColor',
  },
)

const markerId = computed(() => `arrow-${props.x1}-${props.y1}-${props.x2}-${props.y2}`)
const svgWidth = computed(() => Math.max(+props.x1, +props.x2) + 50)
const svgHeight = computed(() => Math.max(+props.y1, +props.y2) + 50)
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
