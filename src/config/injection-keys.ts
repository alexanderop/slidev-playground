import type { ComputedRef, InjectionKey, Ref } from 'vue'

export interface SlideDimensions {
  slideWidth: ComputedRef<number>
  slideHeight: ComputedRef<number>
}

export const slideDimensionsKey: InjectionKey<SlideDimensions> = Symbol('slideDimensions')
export const markdownKey: InjectionKey<Ref<string>> = Symbol('markdown')
export const componentFilesKey: InjectionKey<Ref<Record<string, string>>> = Symbol('componentFiles')
export const presentationClickKey: InjectionKey<Ref<number>> = Symbol('presentationClick')
export const runtimeColorSchemaKey: InjectionKey<Ref<'light' | 'dark' | 'auto'>> =
  Symbol('runtimeColorSchema')

export interface SlidevNav {
  next: () => void
  prev: () => void
  nextSlide: () => void
  prevSlide: () => void
  goToSlide: (index: number) => void
}
export const slidevNavKey: InjectionKey<SlidevNav> = Symbol('slidevNav')
