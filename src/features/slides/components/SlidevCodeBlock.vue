<script setup lang="ts">
import { computed, inject, ref, watchEffect } from 'vue'
import { presentationClickKey } from '../../../config/injection-keys'
import SlidevErrorBlock from './SlidevErrorBlock.vue'
import { getCodeBlockHtml } from '../shiki'

const {
  code,
  language = 'text',
  filename = '',
  highlightSteps = '[]',
  lineNumbers = 'false',
  startLine = '1',
} = defineProps<{
  code: string
  language?: string
  filename?: string
  highlightSteps?: string
  lineNumbers?: string
  startLine?: string
}>()

const html = ref('')
const renderError = ref('')
const currentClick = inject(presentationClickKey, ref(0))

const decodedCode = computed(() => decodeURIComponent(code))
const showLineNumbers = computed(() => lineNumbers === 'true')
const parsedStartLine = computed(() => {
  const value = Number.parseInt(startLine, 10)
  return Number.isFinite(value) && value > 0 ? value : 1
})
const parsedHighlightSteps = computed(() => {
  try {
    const parsed = JSON.parse(highlightSteps) as Array<number[] | ['all']>
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
})
const activeHighlightLines = computed(() => {
  if (parsedHighlightSteps.value.length === 0) {
    return []
  }

  const activeStep =
    parsedHighlightSteps.value[Math.min(currentClick.value, parsedHighlightSteps.value.length - 1)]
  if (!activeStep || activeStep[0] === 'all') {
    return 'all' as const
  }
  return activeStep
})

watchEffect(async () => {
  try {
    html.value = await getCodeBlockHtml(decodedCode.value, language, {
      highlightedLines: activeHighlightLines.value,
      lineNumbers: showLineNumbers.value,
      startLine: parsedStartLine.value,
    })
    renderError.value = ''
  } catch (error) {
    renderError.value = error instanceof Error ? error.message : 'Failed to render code block.'
    html.value = ''
  }
})
</script>

<template>
  <div class="slidev-code-block" :data-title="filename || undefined">
    <div v-if="filename" class="slidev-code-title">{{ filename }}</div>
    <SlidevErrorBlock v-if="renderError" :message="renderError" />
    <!-- eslint-disable vue/no-v-html -->
    <div v-else class="slidev-code-frame" v-html="html"></div>
    <!-- eslint-enable vue/no-v-html -->
  </div>
</template>
