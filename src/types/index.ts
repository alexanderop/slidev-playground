import type { Component } from 'vue'

export interface SlideFrontmatter {
  layout?: string
  transition?: string
  background?: string
  backgroundImage?: string
  image?: string
  class?: string | string[]
  lineNumbers?: boolean
  clicks?: number
  disabled?: boolean
  hide?: boolean
}

export interface SlideSlotMap {
  [name: string]: Component | undefined
}

export interface RenderedSlide {
  totalClicks: number
  layout: string
  transition?: string
  note: string
  background?: string
  backgroundImage?: string
  image?: string
  class?: string
  scopedStyles?: string
  scopeId?: string
  filepath: string
  frontmatter: Record<string, unknown>
  parsedFrontmatter: SlideFrontmatter
  slotComponents: SlideSlotMap
}
