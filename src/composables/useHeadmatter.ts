import type { ComputedRef } from 'vue'
import { type parseSync, resolveConfig } from '@slidev/parser'
import { computed } from 'vue'

export type SlidevConfig = ReturnType<typeof resolveConfig>
export type SlidevMarkdown = ReturnType<typeof parseSync>

export function useHeadmatter(parsed: ComputedRef<SlidevMarkdown>) {
  const config = computed<SlidevConfig>(() => {
    const headmatter = parsed.value.slides[0]?.frontmatter ?? {}
    return resolveConfig(headmatter)
  })

  return { config }
}
