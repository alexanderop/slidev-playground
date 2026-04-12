import type { Component } from 'vue'
import type { ScopeId, SlideFilepath, SlotName } from './brand'

export type SlideFrontmatter = {
  readonly layout?: string
  readonly transition?: string
  readonly background?: string
  readonly backgroundImage?: string
  readonly image?: string
  readonly class?: string | readonly string[]
  readonly lineNumbers?: boolean
  readonly clicks?: number
  readonly disabled?: boolean
  readonly hide?: boolean
  readonly url?: string
}

export type SlideSlotMap = Readonly<Record<SlotName, Component | undefined>>

export type RenderedSlide = {
  readonly totalClicks: number
  readonly layout: string
  readonly transition?: string
  readonly note: string
  readonly background?: string
  readonly backgroundImage?: string
  readonly image?: string
  readonly class?: string
  readonly scopedStyles?: string
  readonly scopeId?: ScopeId
  readonly filepath: SlideFilepath
  readonly parsedFrontmatter: SlideFrontmatter
  readonly slotComponents: SlideSlotMap
}
