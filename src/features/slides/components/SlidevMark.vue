<script setup lang="ts">
import type {
  RoughAnnotation,
  RoughAnnotationConfig,
  RoughAnnotationType,
} from '@slidev/rough-notation'
import { annotate } from '@slidev/rough-notation'
import { inject, onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from 'vue'
import { presentationClickKey } from '../../../config/injection-keys'

/* eslint-disable vue/require-default-prop -- optional props passed through to rough-notation, which supplies its own defaults */
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
/* eslint-enable vue/require-default-prop */

defineSlots<{
  default?: () => unknown
}>()

const DEFAULT_ANIMATION_MS = 800

const contentRef = useTemplateRef<HTMLElement>('contentRef')
const annotation = shallowRef<RoughAnnotation | null>(null)
const currentClick = inject(presentationClickKey, null)

function resolveClickStep(): number | undefined {
  return at === undefined ? undefined : Number(at)
}

function buildConfig(): RoughAnnotationConfig {
  return {
    type,
    animate: true,
    ...(color !== undefined && { color }),
    ...(animationDuration !== undefined && { animationDuration }),
    ...(strokeWidth !== undefined && { strokeWidth }),
    ...(padding !== undefined && { padding }),
    ...(iterations !== undefined && { iterations }),
  }
}

onMounted(() => {
  if (!contentRef.value) {
    return
  }

  annotation.value = annotate(contentRef.value, buildConfig())
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
