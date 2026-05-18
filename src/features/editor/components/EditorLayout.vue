<script setup lang="ts">
import type { EditorView } from '@codemirror/view'
import type { RenderedSlide } from '../../../types'
import type { VNode } from 'vue'
import { computed, ref } from 'vue'
import CodeMirrorEditor from './CodeMirrorEditor.vue'
import ConfigPanel from './ConfigPanel.vue'
import EditorErrorOverlay from './EditorErrorOverlay.vue'
import SlidePreview from '../../../components/SlidePreview.vue'

const {
  markdown,
  componentFiles,
  renderedSlides,
  split,
  slideScale,
  copied,
  editorErrors = [],
} = defineProps<{
  markdown: string
  componentFiles: Record<string, string>
  renderedSlides: readonly RenderedSlide[]
  split: {
    percent: number
    dragging: boolean
    previewSize: { width: number; height: number }
  }
  slideScale: number
  copied: boolean
  editorErrors?: readonly string[]
}>()

const emit = defineEmits<{
  'update:markdown': [value: string]
  'update:componentFiles': [value: Record<string, string>]
  share: []
  present: [index: number]
  startDrag: []
}>()

const previewRef = defineModel<HTMLElement | null>('previewRef', { required: true })
const editorView = defineModel<EditorView | null>('editorView', { required: true })

const activeTab = ref<string>('slides.md')
const configOpen = ref(false)
const showOutput = ref(false)

const renamingFile = ref<{ oldName: string; draft: string } | null>(null)
const renameError = ref<string | null>(null)

function focusRenameInput({ el }: VNode) {
  if (el instanceof HTMLInputElement) {
    el.focus()
    el.select()
  }
}

const fileNames = computed(() => Object.keys(componentFiles))

const combinedErrors = computed<readonly string[]>(() =>
  renameError.value === null ? editorErrors : [renameError.value, ...editorErrors],
)

function activeFileContent(): string {
  if (activeTab.value === 'slides.md') {
    return markdown
  }
  return componentFiles[activeTab.value] ?? ''
}

function onEditorUpdate(value: string) {
  if (activeTab.value === 'slides.md') {
    emit('update:markdown', value)
    return
  }
  emit('update:componentFiles', {
    ...componentFiles,
    [activeTab.value]: value,
  })
}

function addFile() {
  let index = 1
  let name = `Comp${index}.vue`
  while (componentFiles[name] !== undefined) {
    index++
    name = `Comp${index}.vue`
  }
  emit('update:componentFiles', {
    ...componentFiles,
    [name]: `<script setup>\n<\u002Fscript>\n\n<template>\n  <div>\n    <!-- ${name.replace('.vue', '')} -->\n  </div>\n</template>\n`,
  })
  activeTab.value = name
}

function removeFile(name: string) {
  const next = { ...componentFiles }
  delete next[name]
  emit('update:componentFiles', next)
  if (activeTab.value === name) {
    activeTab.value = 'slides.md'
  }
}

function startRename(name: string) {
  renamingFile.value = { oldName: name, draft: name }
  renameError.value = null
}

function cancelRename() {
  renamingFile.value = null
}

function commitRename() {
  if (renamingFile.value === null) {
    return
  }
  const { oldName } = renamingFile.value
  const newName = renamingFile.value.draft.trim()

  if (newName === '' || newName === oldName) {
    cancelRename()
    return
  }

  if (!newName.endsWith('.vue')) {
    renameError.value = `Component files must end in .vue (got "${newName}").`
    return
  }

  if (componentFiles[newName] !== undefined) {
    renameError.value = `File "${newName}" already exists.`
    return
  }

  const renamed: Record<string, string> = {}
  for (const [key, value] of Object.entries(componentFiles)) {
    renamed[key === oldName ? newName : key] = value
  }
  emit('update:componentFiles', renamed)
  if (activeTab.value === oldName) {
    activeTab.value = newName
  }
  renameError.value = null
  cancelRename()
}
</script>

<template>
  <div class="playground">
    <header class="header">
      <div class="header-left">
        <svg viewBox="0 0 555 495" width="22" height="20" class="logo" aria-hidden="true">
          <path d="M277.5 0L555 495H0L277.5 0Z" fill="var(--slidev-theme-primary)" />
        </svg>
        <h1>Slidev <span class="header-tag">Playground</span></h1>
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
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
            />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
        <button class="btn btn-ghost" title="Copy shareable URL" @click="$emit('share')">
          <svg
            v-if="!copied"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          {{ copied ? 'Copied!' : 'Share' }}
        </button>
        <button class="btn btn-primary" @click="$emit('present', 0)">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,3 19,12 5,21" />
          </svg>
          Present
        </button>
      </div>
    </header>

    <div class="split-pane" :class="{ 'show-output': showOutput }">
      <div class="editor-pane" :style="{ width: `${split.percent}%` }">
        <div class="pane-header pane-tabs">
          <button
            class="pane-tab"
            :class="{ active: activeTab === 'slides.md' }"
            @click="activeTab = 'slides.md'"
          >
            slides.md
          </button>
          <template v-for="name in fileNames" :key="name">
            <input
              v-if="renamingFile && renamingFile.oldName === name"
              v-model="renamingFile.draft"
              class="pane-tab pane-tab-rename"
              spellcheck="false"
              @blur="commitRename"
              @keyup.enter="commitRename"
              @keyup.esc="cancelRename"
              @vue:mounted="focusRenameInput"
            />
            <button
              v-else
              class="pane-tab"
              :class="{ active: activeTab === name }"
              @click="activeTab = name"
              @dblclick="startRename(name)"
            >
              {{ name }}
              <span
                class="tab-close"
                role="button"
                :aria-label="`Remove ${name}`"
                @click.stop="removeFile(name)"
              >
                &times;
              </span>
            </button>
          </template>
          <button class="pane-tab pane-tab-add" aria-label="Add component" @click="addFile">
            +
          </button>
        </div>
        <CodeMirrorEditor
          :key="activeTab"
          v-model:editor-view="editorView"
          :model-value="activeFileContent()"
          @update:model-value="onEditorUpdate"
        />
        <EditorErrorOverlay :errors="combinedErrors" />
      </div>

      <div class="divider" @mousedown.prevent="$emit('startDrag')"></div>

      <div class="preview-pane" :style="{ width: `${100 - split.percent}%` }">
        <div class="pane-header">
          <span>Preview</span>
        </div>
        <div v-if="split.dragging" class="preview-size-readout" aria-hidden="true">
          {{ split.previewSize.width }}px × {{ split.previewSize.height }}px
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
        <ConfigPanel v-if="configOpen" @close="configOpen = false" />
      </div>

      <button type="button" class="mobile-toggler" @click="showOutput = !showOutput">
        {{ showOutput ? '< Code' : 'Preview >' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px 0 16px;
  height: 48px;
  background: var(--shell-bg-surface);
  border-bottom: 1px solid var(--shell-border);
  flex-shrink: 0;
  user-select: none;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-left h1 {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.header-tag {
  font-weight: 400;
  color: var(--shell-text-dim);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.slide-badge {
  font-size: 11px;
  color: var(--shell-text-dim);
  padding: 3px 10px;
  background: var(--shell-border);
  border-radius: 99px;
  font-variant-numeric: tabular-nums;
  margin-right: 2px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s,
    color 0.15s,
    box-shadow 0.15s;
  line-height: 1;
  white-space: nowrap;
}

.btn-icon {
  padding: 7px;
  background: transparent;
  border: 1px solid var(--shell-border);
  border-radius: 6px;
  color: var(--shell-text-dim);
}

.btn-icon:hover {
  color: var(--shell-text);
  background: var(--shell-border);
  border-color: var(--shell-border-active);
}

.btn-icon.active {
  border-color: var(--shell-border-active);
  color: var(--shell-text);
  background: var(--shell-border);
}

.btn-primary {
  background: var(--slidev-theme-primary);
  color: #000;
  font-weight: 600;
  border-color: transparent;
}

.btn-primary:hover {
  background: color-mix(in srgb, var(--slidev-theme-primary) 88%, black);
}

.btn-ghost {
  background: transparent;
  border-color: var(--shell-border);
  color: var(--shell-text);
}

.btn-ghost:hover {
  background: var(--shell-border);
  border-color: var(--shell-border-active);
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
  width: 1px;
  background: var(--shell-border);
  cursor: col-resize;
  flex-shrink: 0;
  transition: background 0.15s;
  position: relative;
}

.divider::after {
  content: '';
  position: absolute;
  inset: 0 -3px;
  z-index: 10;
}

.divider:hover {
  background: var(--shell-border-active);
}

.editor-pane {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.pane-header {
  padding: 6px 16px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--shell-text-dim);
  background: var(--shell-bg-surface);
  user-select: none;
}

.pane-tabs {
  display: flex;
  gap: 0;
  padding: 0;
  overflow-x: auto;
}

.pane-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--shell-text-dim);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  white-space: nowrap;
  transition:
    color 0.15s,
    border-color 0.15s;
}

.pane-tab:hover {
  color: var(--shell-text);
}

.pane-tab.active {
  color: var(--shell-text);
  border-bottom-color: var(--slidev-theme-primary);
}

.tab-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  font-size: 13px;
  line-height: 1;
  border-radius: 3px;
  opacity: 0.5;
  cursor: pointer;
}

.tab-close:hover {
  opacity: 1;
  background: var(--shell-border);
}

.pane-tab-add {
  font-size: 14px;
  font-weight: 400;
  padding: 6px 10px;
  opacity: 0.6;
}

.pane-tab-add:hover {
  opacity: 1;
}

.pane-tab-rename {
  border: 1px solid var(--shell-border-active);
  border-radius: 4px;
  background: var(--shell-bg-surface);
  color: var(--shell-text);
  font-family: inherit;
  font-size: 11px;
  padding: 4px 8px;
  margin: 2px 4px;
  outline: none;
  min-width: 90px;
}

.preview-pane {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--shell-preview-bg);
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

.preview-size-readout {
  position: absolute;
  top: 40px;
  left: 10px;
  z-index: 50;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--shell-text-dim);
  background: var(--shell-bg-surface);
  border: 1px solid var(--shell-border);
  border-radius: 4px;
  padding: 4px 8px;
  pointer-events: none;
}

.mobile-toggler {
  display: none;
  position: absolute;
  left: 50%;
  bottom: 20px;
  transform: translateX(-50%);
  z-index: 30;
  padding: 8px 14px;
  font-size: 12px;
  font-family: inherit;
  color: var(--shell-text);
  background: var(--shell-bg-surface);
  border: 1px solid var(--shell-border);
  border-radius: 8px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.18);
  cursor: pointer;
}

.mobile-toggler:hover {
  border-color: var(--shell-border-active);
}

@media (max-width: 720px) {
  .split-pane .editor-pane,
  .split-pane .preview-pane {
    position: absolute;
    inset: 0;
    width: auto !important;
  }

  .split-pane .divider {
    display: none;
  }

  .split-pane .preview-pane,
  .split-pane.show-output .editor-pane {
    z-index: 1;
    pointer-events: none;
    visibility: hidden;
  }

  .split-pane .editor-pane,
  .split-pane.show-output .preview-pane {
    z-index: 2;
    pointer-events: auto;
    visibility: visible;
  }

  .mobile-toggler {
    display: inline-flex;
  }
}
</style>
