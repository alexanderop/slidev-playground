import type { ComputedRef, InjectionKey, Ref } from 'vue'

export interface SlideDimensions {
  slideWidth: ComputedRef<number>
  slideHeight: ComputedRef<number>
}

export const slideDimensionsKey: InjectionKey<SlideDimensions> = Symbol('slideDimensions')
export const markdownKey: InjectionKey<Ref<string>> = Symbol('markdown')
export const presentationClickKey: InjectionKey<Ref<number>> = Symbol('presentationClick')
