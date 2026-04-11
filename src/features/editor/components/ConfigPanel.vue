<script setup lang="ts">
import type { SlidevConfig } from '../../../composables/useHeadmatter'
import { computed, inject } from 'vue'
import FontAutocomplete from './FontAutocomplete.vue'
import { useFrontmatterEditor } from '../composables/useFrontmatterEditor'
import { markdownKey } from '../../../config/injection-keys'

const { config } = defineProps<{
  config: SlidevConfig
}>()

defineEmits<{
  close: []
}>()

const markdown = inject(markdownKey)!
const { updateProperty, removeProperty } = useFrontmatterEditor(markdown)

function updateOptionalStringProperty(path: string, value: string) {
  if (!value) {
    removeProperty(path)
    return
  }
  updateProperty(path, value)
}

function normalizeFontValue(value: unknown): string {
  if (Array.isArray(value)) {
    return String(value[0] ?? '').replaceAll('"', '')
  }

  return typeof value === 'string' ? value : ''
}

const title = computed(() => config.title ?? '')
const colorSchema = computed(() => normalizeColorSchema(config.colorSchema))
const primaryColor = computed(() => (config.themeConfig?.primary as string) ?? '#4fc08d')
const fontSans = computed(() => normalizeFontValue(config.fonts?.sans))
const fontMono = computed(() => normalizeFontValue(config.fonts?.mono))
const contrast = computed(() => Number(config.themeConfig?.contrast ?? 72))
const canvasWidth = computed(() => String(config.canvasWidth ?? 980))
const aspectRatio = computed(() => normalizeAspectRatio(config.aspectRatio))

function normalizeColorSchema(value: unknown): 'auto' | 'light' | 'dark' {
  return value === 'light' || value === 'dark' || value === 'auto' ? value : 'auto'
}

function normalizeAspectRatio(value: unknown): string {
  if (typeof value === 'string') {
    return aspectRatioOptions.some((option) => option.value === value) ? value : '16:9'
  }

  if (typeof value === 'number') {
    if (Math.abs(value - 4 / 3) < 0.001) {
      return '4:3'
    }
    if (Math.abs(value - 1) < 0.001) {
      return '1:1'
    }
  }

  return '16:9'
}

function onTitleChange(value: string) {
  updateOptionalStringProperty('title', value)
}

function onColorSchemaChange(value: string) {
  updateProperty('colorSchema', value)
}

function onPrimaryColorChange(value: string) {
  updateProperty('themeConfig.primary', value)
}

function onContrastChange(value: string) {
  const next = Number.parseInt(value, 10)
  if (Number.isFinite(next) && next >= 30 && next <= 100) {
    updateProperty('themeConfig.contrast', next)
  }
}

function onFontSansChange(value: string) {
  updateOptionalStringProperty('fonts.sans', value)
}

function onFontMonoChange(value: string) {
  updateOptionalStringProperty('fonts.mono', value)
}

function onCanvasWidthChange(value: string) {
  const next = Number.parseInt(value, 10)
  if (Number.isFinite(next) && next > 0) {
    updateProperty('canvasWidth', next)
    return
  }
  removeProperty('canvasWidth')
}

function onAspectRatioChange(value: string) {
  updateProperty('aspectRatio', value)
}

const colorSchemaOptions = [
  { label: 'Auto', value: 'auto' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
] as const

const aspectRatioOptions = [
  { label: '16:9', value: '16:9' },
  { label: '4:3', value: '4:3' },
  { label: '1:1', value: '1:1' },
] as const

const sansFonts = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Poppins',
  'Montserrat',
  'Lato',
  'Nunito',
  'Raleway',
  'Source Sans 3',
  'Work Sans',
  'DM Sans',
  'Plus Jakarta Sans',
  'Outfit',
  'Manrope',
  'Space Grotesk',
  'Geist',
  'Figtree',
  'Lexend',
  'Sora',
  'Albert Sans',
]

const monoFonts = [
  'Fira Code',
  'JetBrains Mono',
  'Source Code Pro',
  'IBM Plex Mono',
  'Roboto Mono',
  'Ubuntu Mono',
  'Space Mono',
  'Inconsolata',
  'Cascadia Code',
  'DM Mono',
]
</script>

<template>
  <div class="config-backdrop" @click.self="$emit('close')">
    <aside class="config-panel" role="dialog" aria-label="Style settings">
      <div class="panel-header">
        <h2>Style</h2>
        <button
          class="close-btn"
          title="Close"
          aria-label="Close style settings"
          @click="$emit('close')"
        >
          &times;
        </button>
      </div>

      <div class="panel-body">
        <section class="section">
          <h3>General</h3>
          <label class="field">
            <span class="field-label">Title</span>
            <input
              type="text"
              class="field-input"
              :value="title"
              placeholder="Presentation title"
              @input="onTitleChange(($event.target as HTMLInputElement).value)"
            />
          </label>
        </section>

        <section class="section">
          <h3>Color</h3>
          <label class="field">
            <span class="field-label">Color mode</span>
            <div class="toggle-group">
              <button
                v-for="option in colorSchemaOptions"
                :key="option.value"
                class="toggle-btn"
                :class="{ active: colorSchema === option.value }"
                @click="onColorSchemaChange(option.value)"
              >
                {{ option.label }}
              </button>
            </div>
          </label>
          <label class="field">
            <span class="field-label">Primary color</span>
            <div class="color-field">
              <input
                type="color"
                class="color-picker"
                :value="primaryColor"
                @input="onPrimaryColorChange(($event.target as HTMLInputElement).value)"
              />
              <input
                type="text"
                class="field-input color-hex"
                :value="primaryColor"
                @input="onPrimaryColorChange(($event.target as HTMLInputElement).value)"
              />
            </div>
          </label>
          <label class="field">
            <span class="field-label">Contrast</span>
            <div class="contrast-field">
              <input
                type="range"
                min="30"
                max="100"
                step="1"
                class="contrast-slider"
                :value="contrast"
                @input="onContrastChange(($event.target as HTMLInputElement).value)"
              />
              <span class="contrast-value">{{ contrast }}</span>
            </div>
          </label>
          <label class="field">
            <span class="field-label">Canvas width</span>
            <input
              type="number"
              min="320"
              step="10"
              class="field-input"
              :value="canvasWidth"
              @input="onCanvasWidthChange(($event.target as HTMLInputElement).value)"
            />
          </label>
          <label class="field">
            <span class="field-label">Aspect ratio</span>
            <select
              class="field-input"
              :value="aspectRatio"
              @change="onAspectRatioChange(($event.target as HTMLSelectElement).value)"
            >
              <option
                v-for="option in aspectRatioOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </label>
        </section>

        <section class="section">
          <h3>Typography</h3>
          <label class="field">
            <span class="field-label">Sans font</span>
            <FontAutocomplete
              :model-value="fontSans"
              :suggestions="sansFonts"
              placeholder="e.g. Inter"
              @update:model-value="onFontSansChange"
            />
          </label>
          <label class="field">
            <span class="field-label">Mono font</span>
            <FontAutocomplete
              :model-value="fontMono"
              :suggestions="monoFonts"
              placeholder="e.g. Fira Code"
              @update:model-value="onFontMonoChange"
            />
          </label>
        </section>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.config-backdrop {
  position: absolute;
  inset: 0;
  z-index: 20;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(2px);
}

.config-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 280px;
  background: var(--shell-bg-surface);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  backdrop-filter: blur(16px);
  box-shadow: var(--shadow-panel);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid var(--shell-border);
}

.panel-header h2 {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--shell-text-dim);
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  color: var(--shell-text-dim);
  padding: 2px 4px;
  border-radius: 4px;
  transition:
    color 0.15s,
    background 0.15s;
}

.close-btn:hover {
  color: var(--shell-text);
  background: var(--shell-border);
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.section {
  margin-bottom: 20px;
}

.section h3 {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--shell-text-dim);
  margin: 0 0 10px 0;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.field-label {
  font-size: 12px;
  color: var(--shell-text);
}

.field-input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid var(--shell-border);
  border-radius: 6px;
  background: var(--shell-bg);
  color: var(--shell-text);
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s;
}

.field-input:focus {
  border-color: var(--slidev-theme-primary);
}

.toggle-group {
  display: flex;
  border: 1px solid var(--shell-border);
  border-radius: 6px;
  overflow: hidden;
}

.toggle-btn {
  flex: 1;
  padding: 6px 0;
  border: none;
  background: var(--shell-bg);
  color: var(--shell-text-dim);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
}

.toggle-btn:first-child {
  border-right: 1px solid var(--shell-border);
}

.toggle-btn + .toggle-btn {
  border-left: 1px solid var(--shell-border);
}

.toggle-btn.active {
  background: var(--accent-subtle);
  color: var(--theme-accent);
  font-weight: 600;
}

.color-field {
  display: flex;
  gap: 8px;
  align-items: center;
}

.color-picker {
  width: 30px;
  height: 30px;
  border: 1px solid var(--shell-border);
  border-radius: 6px;
  padding: 2px;
  cursor: pointer;
  background: none;
  flex-shrink: 0;
}

.color-hex {
  flex: 1;
}

.contrast-field {
  display: flex;
  align-items: center;
  gap: 10px;
}

.contrast-slider {
  flex: 1;
  height: 4px;
  appearance: none;
  background: var(--shell-border);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.contrast-slider::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--shell-text);
  border: 2px solid var(--shell-bg-elevated);
  box-shadow: var(--shadow-card);
  cursor: pointer;
}

.contrast-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--shell-text);
  border: 2px solid var(--shell-bg-elevated);
  box-shadow: var(--shadow-card);
  cursor: pointer;
}

.contrast-value {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--shell-text-dim);
  min-width: 24px;
  text-align: right;
}
</style>
