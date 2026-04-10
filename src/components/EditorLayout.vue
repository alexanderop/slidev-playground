<script setup lang="ts">
import type { EditorView } from '@codemirror/view'
import type { SlidevConfig } from '../composables/useHeadmatter'
import type { RenderedSlide } from '../types'
import { ref } from 'vue'
import CodeMirrorEditor from './CodeMirrorEditor.vue'
import ConfigPanel from './ConfigPanel.vue'
import SlidePreview from './SlidePreview.vue'

defineProps<{
  markdown: string
  config: SlidevConfig
  renderedSlides: RenderedSlide[]
  splitPercent: number
  slideScale: number
  copied: boolean
}>()

defineEmits<{
  'update:markdown': [value: string]
  share: []
  present: [index: number]
  startDrag: []
}>()

const previewRef = defineModel<HTMLElement | null>('previewRef', { required: true })
const editorView = defineModel<EditorView | null>('editorView', { required: true })

const configOpen = ref(false)
</script>

<template>
  <div class="playground">
    <header class="header">
      <div class="header-left">
        <svg viewBox="0 0 100 100" width="24" height="24" class="logo">
          <polygon points="50,10 90,90 10,90" fill="#4FC08D" />
        </svg>
        <h1>Slidev Playground</h1>
      </div>
      <div class="header-actions">
        <span class="slide-badge">{{ renderedSlides.length }} slides</span>
        <button
          class="btn btn-icon"
          title="Style settings"
          :class="{ active: configOpen }"
          @click="configOpen = !configOpen"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="13.5" cy="6.5" r="2.5" />
            <path d="M17 2a2.5 2.5 0 0 1 0 5" />
            <circle cx="8.5" cy="12.5" r="2.5" />
            <path d="M11 10a2.5 2.5 0 0 1 0 5" />
            <circle cx="14.5" cy="18.5" r="2.5" />
            <path d="M18 16a2.5 2.5 0 0 1 0 5" />
            <line x1="2" y1="6.5" x2="11" y2="6.5" />
            <line x1="2" y1="12.5" x2="6" y2="12.5" />
            <line x1="2" y1="18.5" x2="12" y2="18.5" />
            <line x1="16" y1="6.5" x2="22" y2="6.5" />
            <line x1="11" y1="12.5" x2="22" y2="12.5" />
            <line x1="17" y1="18.5" x2="22" y2="18.5" />
          </svg>
        </button>
        <button class="btn btn-secondary" title="Copy shareable URL" @click="$emit('share')">
          {{ copied ? 'Copied!' : 'Share' }}
        </button>
        <button class="btn btn-primary" @click="$emit('present', 0)">Present</button>
      </div>
    </header>

    <div class="split-pane">
      <div class="editor-pane" :style="{ width: `${splitPercent}%` }">
        <div class="pane-header">
          <span>slides.md</span>
        </div>
        <CodeMirrorEditor
          v-model:editor-view="editorView"
          :model-value="markdown"
          @update:model-value="$emit('update:markdown', $event)"
        />
      </div>

      <div class="divider" @mousedown.prevent="$emit('startDrag')"></div>

      <div class="preview-pane" :style="{ width: `${100 - splitPercent}%` }">
        <div class="pane-header">
          <span>Preview</span>
        </div>
        <div ref="previewRef" class="preview-scroll">
          <SlidePreview
            v-for="(slide, index) in renderedSlides"
            :key="index"
            :slide="slide"
            :slide-index="index"
            :slide-number="index + 1"
            :slide-scale="slideScale"
            @select="$emit('present', index)"
          />
        </div>
        <ConfigPanel v-if="configOpen" :config="config" @close="configOpen = false" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 48px;
  background: var(--shell-bg-surface);
  border-bottom: 1px solid var(--shell-border);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-left h1 {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.slide-badge {
  font-size: 12px;
  color: var(--shell-text-dim);
  padding: 2px 8px;
  background: var(--shell-border);
  border-radius: 10px;
}

.btn {
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  background: none;
  border: 1px solid var(--shell-border);
  border-radius: 6px;
  color: var(--shell-text);
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s;
}

.btn-icon:hover {
  background: var(--shell-border);
}

.btn-icon.active {
  border-color: var(--slidev-theme-primary);
  color: var(--slidev-theme-primary);
}

.btn-primary {
  background: var(--slidev-theme-primary);
  color: #000;
}

.btn-primary:hover {
  background: color-mix(in srgb, var(--slidev-theme-primary) 86%, black);
}

.btn-secondary {
  background: var(--shell-border);
  color: var(--shell-text);
}

.btn-secondary:hover {
  background: color-mix(in srgb, var(--shell-border) 80%, white);
}

.playground {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.split-pane {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.divider {
  width: 4px;
  background: var(--shell-border);
  cursor: col-resize;
  flex-shrink: 0;
  transition: background 0.15s;
}

.divider:hover {
  background: var(--slidev-theme-primary);
}

.editor-pane {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pane-header {
  padding: 8px 16px;
  font-size: 12px;
  color: var(--shell-text-dim);
  background: var(--shell-bg-surface);
  border-bottom: 1px solid var(--shell-border);
}

.preview-pane {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--shell-bg);
  position: relative;
}

.preview-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
