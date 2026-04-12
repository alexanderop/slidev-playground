import type { Ref } from 'vue'
import { computed, onMounted, onUnmounted, watch, watchEffect } from 'vue'

import { compileCustomComponents, parseComponentFiles } from '../features/slides/custom-components'
import { clearComponentCache } from '../features/slides/render'

export function useCustomComponents(componentFiles: Ref<Record<string, string>>) {
  const customComponents = computed(() => {
    const parsedComponents = parseComponentFiles(componentFiles.value)
    return compileCustomComponents(parsedComponents)
  })

  watch(customComponents, () => {
    clearComponentCache()
  })

  const customStyleTag = document.createElement('style')
  customStyleTag.id = 'slidev-custom-component-styles'

  onMounted(() => {
    document.head.append(customStyleTag)
    watchEffect(() => {
      customStyleTag.textContent = customComponents.value.styles
    })
  })

  onUnmounted(() => {
    customStyleTag.remove()
  })

  return { customComponents }
}
