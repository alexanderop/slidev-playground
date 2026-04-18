<script setup lang="ts">
import type { RenderedSlide } from '../../../types'
import { useWindowSize } from '@vueuse/core'
import { computed, inject, ref } from 'vue'
import { useClickAnimation } from '../composables/useClickAnimation'
import { slideDimensionsKey } from '../../../config/injection-keys'
import { renderMarkdown } from '../../../utils/renderer'
import GotoDialog from './GotoDialog.vue'
import PresentControls from './PresentControls.vue'
import SlideSurface from '../../../components/SlideSurface.vue'
import SlideOverview from './SlideOverview.vue'
import SpeakerNotes from './SpeakerNotes.vue'

const {
  slides,
  currentSlide,
  currentClick,
  transitionName,
  showOverview,
  showNotes,
  showGotoDialog,
} = defineProps<{
  slides: readonly RenderedSlide[]
  currentSlide: number
  currentClick: number
  transitionName: string
  showOverview: boolean
  showNotes: boolean
  showGotoDialog: boolean
}>()

defineEmits<{
  close: []
  prev: []
  next: []
  exit: []
  selectSlide: [index: number]
  closeOverview: []
  closeGoto: []
}>()

const presentSlideRef = ref<HTMLElement | null>(null)
const dimensions = inject(slideDimensionsKey)!
const { width: windowWidth, height: windowHeight } = useWindowSize()

useClickAnimation(presentSlideRef, () => ({
  currentClick,
  currentSlide,
}))

const activeSlide = computed(() => slides[currentSlide])
const totalClicks = computed(() => activeSlide.value?.totalClicks || 0)
const noteHtml = computed(() => {
  const note = activeSlide.value?.note
  return note ? renderMarkdown(note) : ''
})
const canGoPrev = computed(() => currentSlide > 0 || currentClick > 0)
const canGoNext = computed(() => {
  if (!activeSlide.value) {
    return false
  }

  return currentSlide < slides.length - 1 || currentClick < activeSlide.value.totalClicks
})

const presentScale = computed(() =>
  Math.min(
    windowWidth.value / dimensions.slideWidth.value,
    windowHeight.value / dimensions.slideHeight.value,
  ),
)
</script>

<template>
  <!-- eslint-disable vue/no-v-html -->
  <div
    class="present-overlay"
    role="dialog"
    aria-label="Presentation mode"
    @click.self="$emit('close')"
  >
    <div ref="presentSlideRef" class="present-slide">
      <Transition :name="transitionName" mode="out-in">
        <SlideSurface :key="currentSlide" :slide="activeSlide!" :scale="presentScale" />
      </Transition>
    </div>

    <PresentControls
      :current-slide="currentSlide"
      :total-slides="slides.length"
      :current-click="currentClick"
      :total-clicks="totalClicks"
      :can-go-prev="canGoPrev"
      :can-go-next="canGoNext"
      @prev="$emit('prev')"
      @next="$emit('next')"
      @exit="$emit('exit')"
    />

    <SlideOverview
      v-if="showOverview"
      :slides="slides"
      :current-slide="currentSlide"
      @select="$emit('selectSlide', $event)"
      @close="$emit('closeOverview')"
    />

    <GotoDialog
      :open="showGotoDialog"
      :current-slide="currentSlide"
      :total-slides="slides.length"
      @close="$emit('closeGoto')"
      @select="$emit('selectSlide', $event)"
    />

    <SpeakerNotes
      v-if="showNotes && noteHtml"
      :note-html="noteHtml"
      :current-click="currentClick"
    />

    <div class="click-zone click-zone-left" @click="$emit('prev')"></div>
    <div class="click-zone click-zone-right" @click="$emit('next')"></div>
  </div>
  <!-- eslint-enable vue/no-v-html -->
</template>

<style scoped>
.present-overlay {
  position: fixed;
  inset: 0;
  background: var(--slidev-slide-container-background, #000);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.present-overlay:hover :deep(.present-controls) {
  opacity: 1;
}

.present-slide {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.click-zone {
  position: fixed;
  top: 0;
  bottom: 60px;
  width: 30%;
  z-index: 1001;
  cursor: pointer;
}

.click-zone-left {
  left: 0;
}

.click-zone-right {
  right: 0;
}
</style>
