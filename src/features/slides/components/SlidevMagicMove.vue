<script setup lang="ts">
import { ShikiMagicMove } from 'shiki-magic-move/vue'
import 'shiki-magic-move/dist/style.css'
import { computed, inject, ref, shallowRef, watchEffect } from 'vue'
import { presentationClickKey } from '../../../config/injection-keys'
import { getShikiHighlighter } from '../shiki'

const props = defineProps<{
  steps: string
  lang: string
}>()

const currentClick = inject(presentationClickKey, ref(0))
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const highlighter = shallowRef<any>(null)

const parsedSteps = computed<Array<{ code: string; lang: string }>>(() => {
  try {
    return JSON.parse(decodeURIComponent(props.steps))
  } catch {
    return []
  }
})

const currentStep = computed(() => {
  const index = Math.min(currentClick.value, parsedSteps.value.length - 1)
  return parsedSteps.value[Math.max(0, index)]
})

watchEffect(async () => {
  highlighter.value = await getShikiHighlighter()
})
</script>

<template>
  <div class="slidev-magic-move-container">
    <ShikiMagicMove
      v-if="highlighter && currentStep"
      :highlighter="highlighter"
      :lang="currentStep.lang || lang"
      theme="vitesse-dark"
      :code="currentStep.code"
      :options="{ duration: 800, stagger: 0.3, lineNumbers: false }"
    />
  </div>
</template>
