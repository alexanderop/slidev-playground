<script setup lang="ts">
import { computed, inject, onMounted, ref, watchEffect } from 'vue'
import { presentationClickKey } from '../../../config/injection-keys'

const { ranges } = defineProps<{
  ranges: string
}>()

const el = ref<HTMLDivElement>()
const currentClick = inject(presentationClickKey, ref(0))

const parsedRanges = computed<string[]>(() => {
  try {
    return JSON.parse(ranges)
  } catch {
    return []
  }
})

function parseRangeString(totalLines: number, rangeStr: string): number[] {
  if (rangeStr === 'all' || rangeStr === '*') {
    return Array.from({ length: totalLines }, (_, i) => i + 1)
  }

  const result: number[] = []
  for (const part of rangeStr.split(',')) {
    const trimmed = part.trim()
    if (trimmed.includes('-')) {
      const [startRaw, endRaw] = trimmed.split('-')
      const start = Number.parseInt(startRaw, 10)
      const end = Number.parseInt(endRaw, 10)
      if (Number.isFinite(start) && Number.isFinite(end)) {
        for (let i = start; i <= end; i++) {
          result.push(i)
        }
      }
      continue
    }
    const value = Number.parseInt(trimmed, 10)
    if (Number.isFinite(value)) {
      result.push(value)
    }
  }
  return result
}

onMounted(() => {
  watchEffect(() => {
    if (el.value === null || el.value === undefined || parsedRanges.value.length === 0) {
      return
    }

    const click = currentClick.value
    const index = Math.min(click, parsedRanges.value.length - 1)
    const rangeStr = parsedRanges.value[index] ?? parsedRanges.value.at(-1) ?? 'all'

    const equationParents = el.value.querySelectorAll('.mtable > [class*=col-align]')
    if (equationParents.length === 0) {
      return
    }

    const equationRowsOfEachParent = Array.from(equationParents).map((item) =>
      Array.from(item.querySelectorAll(':scope > .vlist-t > .vlist-r > .vlist > span > .mord')),
    )

    const lines: Element[][] = []
    for (const equationRowParent of equationRowsOfEachParent) {
      equationRowParent.forEach((equationRow, idx) => {
        lines[idx] = Array.isArray(lines[idx]) ? [...lines[idx], equationRow] : [equationRow]
      })
    }

    const highlights = parseRangeString(lines.length, rangeStr)
    lines.forEach((line, idx) => {
      const highlighted = highlights.includes(idx + 1)
      line.forEach((node) => {
        node.classList.toggle('highlighted', highlighted)
        node.classList.toggle('dishonored', !highlighted)
      })
    })
  })
})
</script>

<template>
  <div ref="el" class="slidev-katex-wrapper">
    <slot></slot>
  </div>
</template>
