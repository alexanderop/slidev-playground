<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from 'vue'

const blocksRef = useTemplateRef('blocksRef')
const activeTitle = ref('')
const tabs = ref<string[]>([])

function updateActiveBlock() {
  const blocks = blocksRef.value?.querySelectorAll('.slidev-code-block[data-title]')
  blocks?.forEach((block) => {
    const title = (block as HTMLElement).dataset.title
    block.classList.toggle('active', title === activeTitle.value)
  })
}

function selectTab(tab: string) {
  activeTitle.value = tab
  updateActiveBlock()
}

onMounted(() => {
  const blocks = blocksRef.value?.querySelectorAll('.slidev-code-block[data-title]')
  blocks?.forEach((block) => {
    const title = (block as HTMLElement).dataset.title ?? ''
    if (title) {
      tabs.value.push(title)
      if (activeTitle.value === '') {
        activeTitle.value = title
      }
    }
  })
  updateActiveBlock()
})
</script>

<template>
  <div class="slidev-code-group">
    <div class="slidev-code-group-tabs">
      <div
        v-for="tab in tabs"
        :key="tab"
        class="slidev-code-tab"
        :class="{ active: activeTitle === tab }"
        @click.stop="selectTab(tab)"
      >
        {{ tab }}
      </div>
    </div>
    <div ref="blocksRef" class="slidev-code-group-blocks">
      <slot />
    </div>
  </div>
</template>
