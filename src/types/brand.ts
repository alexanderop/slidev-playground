export type Brand<T, B extends string> = T & { readonly __brand: B }

export type ScopeId = Brand<string, 'ScopeId'>
export type SlideFilepath = Brand<string, 'SlideFilepath'>
export type SlotName = Brand<string, 'SlotName'>
export type ComponentTag = Brand<string, 'ComponentTag'>

/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */
export const asScopeId = (value: string): ScopeId => value as ScopeId
export const asSlideFilepath = (value: string): SlideFilepath => value as SlideFilepath
export const asSlotName = (value: string): SlotName => value as SlotName
export const asComponentTag = (value: string): ComponentTag => value as ComponentTag
/* eslint-enable @typescript-eslint/no-unsafe-type-assertion */
