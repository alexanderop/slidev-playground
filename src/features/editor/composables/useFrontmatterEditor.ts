import type { Ref } from 'vue'
import type { YamlValue } from '../frontmatter/core'
import { applyPatch } from '../frontmatter/core'

/**
 * Low-level escape hatch for atomic multi-field frontmatter edits.
 * New UI code should use `useFrontmatterField` instead.
 */
export function useFrontmatterEditor(markdown: Ref<string>) {
  function updateProperty(dotKey: string, value: YamlValue): void {
    markdown.value = applyPatch(markdown.value, { op: 'set', path: dotKey, value })
  }

  function removeProperty(dotKey: string): void {
    markdown.value = applyPatch(markdown.value, { op: 'remove', path: dotKey })
  }

  return { updateProperty, removeProperty }
}
