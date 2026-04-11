<script setup lang="ts">
import { useElementSize } from '@vueuse/core'
import { computed, ref, watch } from 'vue'

const { max = 100, min = 30 } = defineProps<{
  max?: number
  min?: number
}>()

const container = ref<HTMLDivElement>()
const inner = ref<HTMLDivElement>()
const size = ref(100)
const fontSize = computed(() => `${size.value}px`)

const containerSize = useElementSize(container)
const innerSize = useElementSize(inner)

const wrapLen = ref(0)
const wrap = ref('nowrap')

watch([container, containerSize.width, innerSize.width], () => {
  if (!container.value || innerSize.width.value <= 0) {
    return
  }
  const ratio = containerSize.width.value / innerSize.width.value
  if (Number.isNaN(ratio) || ratio <= 0) {
    return
  }

  let newSize = size.value * ratio
  if (newSize < min) {
    wrapLen.value = inner.value?.textContent?.length ?? 0
    wrap.value = ''
  }
  if (newSize >= min && (inner.value?.textContent?.length ?? 0) < wrapLen.value) {
    wrap.value = 'nowrap'
  }
  newSize = Math.max(min, Math.min(max, newSize))
  size.value = newSize
})
</script>

<template>
  <div ref="container" class="slidev-auto-fit-text">
    <div ref="inner" class="slidev-auto-fit-text-inner">
      <slot />
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
