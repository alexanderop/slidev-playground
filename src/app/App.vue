<script setup lang="ts">
import type { EditorView } from '@codemirror/view'
import { parseSync } from '@slidev/parser'
import { useFullscreen } from '@vueuse/core'
import { computed, onMounted, onUnmounted, provide, ref, watch, watchEffect } from 'vue'

import EditorLayout from '../features/editor/components/EditorLayout.vue'
import PresentationOverlay from '../features/presentation/components/PresentationOverlay.vue'
import { useFontLoader } from '../composables/useFontLoader'
import { useHeadmatter } from '../composables/useHeadmatter'
import { usePresentation } from '../features/presentation/composables/usePresentation'
import { useScrollSync } from '../features/editor/composables/useScrollSync'
import { useSlideDimensions } from '../composables/useSlideDimensions'
import { useSlideScale } from '../composables/useSlideScale'
import { useSplitPane } from '../composables/useSplitPane'
import { useTheme } from '../composables/useTheme'
import { useUrlSync } from '../composables/useUrlSync'
import {
  componentFilesKey,
  markdownKey,
  presentationClickKey,
  runtimeColorSchemaKey,
  slidevNavKey,
} from '../config/injection-keys'
import { defaultComponentFiles, defaultContent } from '../config/default-content'
import { resolveSlidesFromMarkdown } from '../features/slides/imports'
import { compileCustomComponents, parseComponentFiles } from '../features/slides/custom-components'
import { clearComponentCache, renderSlides } from '../features/slides/render'
import type { RenderedSlide } from '../types'

const markdown = ref('')
const componentFiles = ref<Record<string, string>>({})
provide(markdownKey, markdown)
provide(componentFilesKey, componentFiles)

const parsed = computed(() => parseSync(markdown.value, 'slides.md'))
const resolvedSlides = computed(() => resolveSlidesFromMarkdown(markdown.value, 'slides.md'))

const { config } = useHeadmatter(parsed)
const runtimeColorSchema = ref<'light' | 'dark' | 'auto'>('auto')
provide(runtimeColorSchemaKey, runtimeColorSchema)
const defaults = computed(
  () => (parsed.value.slides[0]?.frontmatter.defaults as Record<string, unknown> | undefined) ?? {},
)

const slideDimensions = useSlideDimensions(config)

const { effectiveMode } = useTheme({
  frontmatterPrimary: computed(() => config.value.themeConfig?.primary as string | undefined),
  frontmatterColorSchema: computed(() => config.value.colorSchema as string | undefined),
  themeConfig: computed(() => config.value.themeConfig as Record<string, unknown> | undefined),
  runtimeColorSchema,
})

useFontLoader(computed(() => config.value.fonts))

const customComponents = computed(() => {
  const parsedComponents = parseComponentFiles(componentFiles.value)
  return compileCustomComponents(parsedComponents)
})

watch(customComponents, () => clearComponentCache())

const renderedSlides = computed<RenderedSlide[]>(() => {
  return renderSlides(
    resolvedSlides.value,
    config.value,
    defaults.value,
    customComponents.value.components,
  )
})

const { loadFromHash, share, copied } = useUrlSync(markdown, componentFiles, {
  markdown: defaultContent,
  componentFiles: defaultComponentFiles,
})

onMounted(() => {
  const state = loadFromHash()
  markdown.value = state.markdown
  componentFiles.value = state.componentFiles

  const customStyleTag = document.createElement('style')
  customStyleTag.id = 'slidev-custom-component-styles'
  document.head.append(customStyleTag)
  watchEffect(() => {
    customStyleTag.textContent = customComponents.value.styles
  })
  onUnmounted(() => customStyleTag.remove())
})

function toggleRuntimeDarkMode() {
  const nextMode = effectiveMode.value === 'dark' ? 'light' : 'dark'
  runtimeColorSchema.value = nextMode
}

const { toggle: toggleFullscreen } = useFullscreen()

const presentation = usePresentation(() => renderedSlides.value, {
  toggleDark: toggleRuntimeDarkMode,
  toggleFullscreen,
})
const presentationClick = computed(() =>
  presentation.presenting.value ? presentation.currentClick.value : 0,
)
provide(presentationClickKey, presentationClick)
provide(slidevNavKey, {
  next: presentation.next,
  prev: presentation.prev,
  nextSlide: presentation.nextSlide,
  prevSlide: presentation.prevSlide,
  goToSlide: presentation.goToSlide,
})

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
    :show-goto-dialog="presentation.showGotoDialog.value"
    @close="presentation.stop"
    @prev="presentation.prev"
    @next="presentation.next"
    @exit="presentation.stop"
    @select-slide="presentation.goToSlide"
    @close-overview="presentation.showOverview.value = false"
    @close-goto="presentation.showGotoDialog.value = false"
  />

  <EditorLayout
    v-else
    v-model:editor-view="editorView"
    v-model:preview-ref="previewRef"
    :markdown="markdown"
    :component-files="componentFiles"
    :config="config"
    :rendered-slides="renderedSlides"
    :split-percent="splitPercent"
    :slide-scale="slideScale"
    :copied="copied"
    @update:markdown="markdown = $event"
    @update:component-files="componentFiles = $event"
    @share="share"
    @present="presentation.start"
    @start-drag="startDrag"
  />
</template>
