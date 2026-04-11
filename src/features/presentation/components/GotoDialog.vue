<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

const { currentSlide, open, totalSlides } = defineProps<{
  currentSlide: number
  open: boolean
  totalSlides: number
}>()

const emit = defineEmits<{
  close: []
  select: [index: number]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const query = ref('')
const selectedIndex = ref(0)

const matches = computed(() => {
  const trimmed = query.value.trim()
  if (!trimmed) {
    return Array.from({ length: totalSlides }, (_, index) => index)
  }

  return Array.from({ length: totalSlides }, (_, index) => index).filter((index) => {
    const number = String(index + 1)
    return number.includes(trimmed)
  })
})

function close() {
  emit('close')
}

function confirmSelection() {
  const target = matches.value[selectedIndex.value]
  if (target === undefined) {
    close()
    return
  }

  emit('select', target)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    confirmSelection()
    return
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    if (matches.value.length > 0) {
      selectedIndex.value = (selectedIndex.value + 1) % matches.value.length
    }
    return
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    if (matches.value.length > 0) {
      selectedIndex.value = (selectedIndex.value - 1 + matches.value.length) % matches.value.length
    }
  }
}

watch(
  () => open,
  async (isOpen) => {
    if (!isOpen) {
      query.value = ''
      selectedIndex.value = 0
      return
    }

    query.value = ''
    selectedIndex.value = 0
    await nextTick()
    inputRef.value?.focus()
    inputRef.value?.select()
  },
)

watch(matches, (nextMatches) => {
  if (nextMatches.length === 0) {
    selectedIndex.value = 0
    return
  }

  if (selectedIndex.value >= nextMatches.length) {
    selectedIndex.value = 0
  }
})
</script>

<template>
  <div v-if="open" class="goto-backdrop" @click.self="close">
    <section class="goto-panel" role="dialog" aria-label="Goto slide">
      <label class="goto-label" for="goto-slide-input">Goto slide</label>
      <input
        id="goto-slide-input"
        ref="inputRef"
        v-model="query"
        type="text"
        class="goto-input"
        placeholder="Type a slide number"
        @keydown="onKeydown"
      />

      <ul
        v-if="matches.length > 0"
        class="goto-results"
        role="listbox"
        aria-label="Matching slides"
      >
        <li v-for="(slideIndex, index) in matches" :key="slideIndex">
          <button
            type="button"
            class="goto-result"
            :class="{ active: index === selectedIndex, current: slideIndex === currentSlide }"
            :aria-label="`Go to slide ${slideIndex + 1}`"
            @click="emit('select', slideIndex)"
          >
            <span>Slide {{ slideIndex + 1 }}</span>
            <span v-if="slideIndex === currentSlide" class="goto-current">Current</span>
          </button>
        </li>
      </ul>

      <p v-else class="goto-empty">No matching slides.</p>
    </section>
  </div>
</template>

<style scoped>
.goto-backdrop {
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  padding: 20px;
  z-index: 1002;
  pointer-events: auto;
}

.goto-panel {
  width: 320px;
  max-height: calc(100vh - 40px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  background: rgba(22, 24, 29, 0.94);
  color: #f5f7fa;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(12px);
}

.goto-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: rgba(245, 247, 250, 0.72);
}

.goto-input {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  color: inherit;
  padding: 10px 12px;
  font: inherit;
  transition: border-color 0.15s;
}

.goto-input:focus {
  outline: none;
  border-color: var(--slidev-theme-primary);
  box-shadow: 0 0 0 1px var(--slidev-theme-primary);
}

.goto-results {
  margin: 0;
  padding: 0;
  list-style: none;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.goto-result {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border: 0;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.goto-result:hover,
.goto-result.active {
  background: rgba(255, 255, 255, 0.1);
}

.goto-result.current {
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.goto-current {
  font-size: 11px;
  color: rgba(245, 247, 250, 0.68);
}

.goto-empty {
  margin: 0;
  color: rgba(245, 247, 250, 0.68);
  font-size: 13px;
}
</style>
