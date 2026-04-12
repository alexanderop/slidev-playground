import type { ComputedRef, InjectionKey, Ref } from 'vue'

export type SlideDimensions = {
  slideWidth: ComputedRef<number>
  slideHeight: ComputedRef<number>
}

export const slideDimensionsKey: InjectionKey<SlideDimensions> = Symbol('slideDimensions')
export const markdownKey: InjectionKey<Ref<string>> = Symbol('markdown')
export const componentFilesKey: InjectionKey<Ref<Record<string, string>>> = Symbol('componentFiles')
export const presentationClickKey: InjectionKey<Ref<number>> = Symbol('presentationClick')
export const runtimeColorSchemaKey: InjectionKey<Ref<'light' | 'dark' | 'auto'>> =
  Symbol('runtimeColorSchema')

export type SlidevNav = {
  next: () => void
  prev: () => void
  nextSlide: () => void
  prevSlide: () => void
  goToSlide: (index: number) => void
}
export const slidevNavKey: InjectionKey<SlidevNav> = Symbol('slidevNav')

export const defaultSlidevNav: SlidevNav = {
  next: () => {},
  prev: () => {},
  nextSlide: () => {},
  prevSlide: () => {},
  goToSlide: () => {},
}

export const currentSlideIndexKey: InjectionKey<ComputedRef<number>> = Symbol('currentSlideIndex')
export const totalSlidesKey: InjectionKey<ComputedRef<number>> = Symbol('totalSlides')
export const effectiveModeKey: InjectionKey<ComputedRef<'light' | 'dark'>> = Symbol('effectiveMode')
