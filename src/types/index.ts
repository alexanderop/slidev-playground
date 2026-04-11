import type { Component } from 'vue'

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
  slotComponents: SlideSlotMap
}
