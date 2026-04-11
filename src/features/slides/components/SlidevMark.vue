<script setup lang="ts">
import type {
  RoughAnnotation,
  RoughAnnotationConfig,
  RoughAnnotationType,
} from '@slidev/rough-notation'
import { annotate } from '@slidev/rough-notation'
import { inject, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { presentationClickKey } from '../../../config/injection-keys'

const {
  type = 'underline',
  color,
  at,
  animationDuration,
  strokeWidth,
  padding,
  iterations,
} = defineProps<{
  type?: RoughAnnotationType
  color?: string
  at?: number | string
  animationDuration?: number
  strokeWidth?: number
  padding?: number
  iterations?: number
}>()

const DEFAULT_ANIMATION_MS = 800

const contentRef = ref<HTMLElement | null>(null)
const annotation = shallowRef<RoughAnnotation | null>(null)
const currentClick = inject(presentationClickKey, null)

function resolveClickStep(): number | undefined {
  return at === undefined ? undefined : Number(at)
}

onMounted(() => {
  if (!contentRef.value) {
    return
  }

  const config: RoughAnnotationConfig = {
    type,
    animate: true,
    ...(color !== undefined && { color }),
    ...(animationDuration !== undefined && { animationDuration }),
    ...(strokeWidth !== undefined && { strokeWidth }),
    ...(padding !== undefined && { padding }),
    ...(iterations !== undefined && { iterations }),
  }

  annotation.value = annotate(contentRef.value, config)

  const clickStep = resolveClickStep()

  if (clickStep === undefined || currentClick === null) {
    annotation.value.show()
    return
  }

  // Already past this click step — show without animation
  if (currentClick.value >= clickStep) {
    annotation.value.animationDuration = 0
    annotation.value.show()
    annotation.value.animationDuration = animationDuration ?? DEFAULT_ANIMATION_MS
  }
})

watch(
  () => currentClick?.value,
  (click) => {
    if (!annotation.value || click === undefined) {
      return
    }
    const clickStep = resolveClickStep()
    if (clickStep === undefined) {
      return
    }
    if (click >= clickStep) {
      annotation.value.show()
      return
    }
    annotation.value.hide()
  },
)

onBeforeUnmount(() => {
  annotation.value?.remove()
})
</script>

<template>
  <span ref="contentRef" class="slidev-mark">
    <slot></slot>
  </span>
</template>
