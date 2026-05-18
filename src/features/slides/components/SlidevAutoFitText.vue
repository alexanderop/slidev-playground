<script setup lang="ts">
import { useElementSize } from '@vueuse/core'
import { computed, ref, useTemplateRef, watch } from 'vue'

const { max = 100, min = 30 } = defineProps<{
  max?: number
  min?: number
}>()

defineSlots<{
  default?: () => unknown
}>()

const container = useTemplateRef<HTMLDivElement>('container')
const inner = useTemplateRef<HTMLDivElement>('inner')
const size = ref(100)
const fontSize = computed(() => `${size.value}px`)

const containerSize = useElementSize(container)
const innerSize = useElementSize(inner)

const wrapLen = ref(0)
const wrap = ref('nowrap')

function updateWrap(newSize: number): void {
  const innerLength = inner.value?.textContent?.length ?? 0
  if (newSize < min) {
    wrapLen.value = innerLength
    wrap.value = ''
    return
  }
  if (innerLength < wrapLen.value) {
    wrap.value = 'nowrap'
  }
}

watch([container, containerSize.width, innerSize.width], () => {
  if (!container.value || innerSize.width.value <= 0) {
    return
  }
  const ratio = containerSize.width.value / innerSize.width.value
  if (Number.isNaN(ratio) || ratio <= 0) {
    return
  }

  const projected = size.value * ratio
  updateWrap(projected)
  size.value = Math.max(min, Math.min(max, projected))
})
</script>

<template>
  <div ref="container" class="slidev-auto-fit-text">
    <div ref="inner" class="slidev-auto-fit-text-inner">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.slidev-auto-fit-text {
  overflow: auto;
  font-size: v-bind(fontSize);
  white-space: v-bind(wrap);
}

.slidev-auto-fit-text-inner {
  display: inline-block;
}
</style>
