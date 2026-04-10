<script setup lang="ts">
import type { EditorView } from '@codemirror/view'
import { parseSync } from '@slidev/parser'
import { computed, onMounted, provide, ref } from 'vue'

import EditorLayout from './components/EditorLayout.vue'
import PresentationOverlay from './components/PresentationOverlay.vue'
import { useFontLoader } from './composables/useFontLoader'
import { useHeadmatter } from './composables/useHeadmatter'
import { usePresentation } from './composables/usePresentation'
import { useScrollSync } from './composables/useScrollSync'
import { useSlideDimensions } from './composables/useSlideDimensions'
import { useSlideScale } from './composables/useSlideScale'
import { useSplitPane } from './composables/useSplitPane'
import { useTheme } from './composables/useTheme'
import { useUrlSync } from './composables/useUrlSync'
import { markdownKey, presentationClickKey } from './injection-keys'
import { defaultContent } from './default-content'
import { resolveSlidesFromMarkdown } from './slidev/imports'
import { renderSlides } from './slidev/render'
import type { RenderedSlide } from './types'

const markdown = ref('')
provide(markdownKey, markdown)

const parsed = computed(() => parseSync(markdown.value, 'slides.md'))
const resolvedSlides = computed(() => resolveSlidesFromMarkdown(markdown.value, 'slides.md'))

const { config } = useHeadmatter(parsed)
const defaults = computed(
  () => (parsed.value.slides[0]?.frontmatter.defaults as Record<string, unknown> | undefined) ?? {},
)

const slideDimensions = useSlideDimensions(config)

useTheme({
  frontmatterPrimary: computed(() => config.value.themeConfig?.primary as string | undefined),
  frontmatterColorSchema: computed(() => config.value.colorSchema as string | undefined),
  themeConfig: computed(() => config.value.themeConfig as Record<string, unknown> | undefined),
})

useFontLoader(computed(() => config.value.fonts))

const renderedSlides = computed<RenderedSlide[]>(() => {
  return renderSlides(resolvedSlides.value, config.value, defaults.value)
})

const { loadFromHash, share, copied } = useUrlSync(markdown, defaultContent)

onMounted(() => {
  markdown.value = loadFromHash()
})

const presentation = usePresentation(() => renderedSlides.value)
const presentationClick = computed(() =>
  presentation.presenting.value ? presentation.currentClick.value : 0,
)
provide(presentationClickKey, presentationClick)

const previewRef = ref<HTMLElement | null>(null)
const editorView = ref<EditorView | null>(null)
const { slideScale, updateScale } = useSlideScale(previewRef, slideDimensions)
const { splitPercent, startDrag } = useSplitPane(updateScale)

useScrollSync(
  editorView,
  previewRef,
  computed(() => parsed.value.slides),
)
</script>

<template>
  <PresentationOverlay
    v-if="presentation.presenting.value"
    :slides="renderedSlides"
    :current-slide="presentation.currentSlide.value"
    :current-click="presentation.currentClick.value"
    :transition-name="presentation.transitionName.value"
    :show-overview="presentation.showOverview.value"
    :show-notes="presentation.showNotes.value"
    @close="presentation.stop"
    @prev="presentation.prev"
    @next="presentation.next"
    @exit="presentation.stop"
    @select-slide="presentation.goToSlide"
    @close-overview="presentation.showOverview.value = false"
  />

  <EditorLayout
    v-else
    v-model:editor-view="editorView"
    v-model:preview-ref="previewRef"
    :markdown="markdown"
    :config="config"
    :rendered-slides="renderedSlides"
    :split-percent="splitPercent"
    :slide-scale="slideScale"
    :copied="copied"
    @update:markdown="markdown = $event"
    @share="share"
    @present="presentation.start"
    @start-drag="startDrag"
  />
</template>
