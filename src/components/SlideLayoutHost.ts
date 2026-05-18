import type { Component, PropType, VNode } from 'vue'
import { computed, defineComponent, h } from 'vue'
import type { RenderedSlide } from '../types'

type SlotRenderer = (() => VNode | null) | undefined
type SlotMap = Record<string, SlotRenderer>
type LayoutContext = {
  className: unknown[]
  slots: SlotMap
  imageStyle: Record<string, string> | undefined
  iframeUrl: string | null
}
type LayoutRenderer = (ctx: LayoutContext) => VNode

function renderSlotComponent(component?: Component): SlotRenderer {
  if (!component) {
    return undefined
  }
  return () => h(component)
}

function renderIframe(url: string): VNode {
  return h('iframe', {
    class: 'slidev-layout-iframe-frame',
    src: url,
    title: 'Embedded slide content',
  })
}

const defaultSection: LayoutRenderer = ({ className, slots }) =>
  h('section', { class: className }, [slots.default?.()])

const layoutRenderers: Record<string, LayoutRenderer> = {
  cover: defaultSection,
  center: defaultSection,
  section: defaultSection,
  statement: defaultSection,
  fact: defaultSection,
  intro: defaultSection,
  end: defaultSection,
  '404': defaultSection,
  error: defaultSection,
  full: defaultSection,
  none: defaultSection,
  quote: ({ className, slots }) =>
    h('section', { class: className }, [h('blockquote', [slots.default?.()])]),
  'two-cols': ({ className, slots }) =>
    h('section', { class: className }, [
      h('div', { class: 'slidev-layout-main' }, [slots.default?.()]),
      h('div', { class: 'slidev-layout-side' }, [slots.right?.()]),
    ]),
  'two-cols-header': ({ className, slots }) =>
    h('section', { class: className }, [
      h('header', { class: 'slidev-layout-header' }, [slots.header?.()]),
      h('div', { class: 'slidev-layout-body' }, [
        h('div', { class: 'slidev-layout-main' }, [slots.default?.()]),
        h('div', { class: 'slidev-layout-side' }, [slots.right?.()]),
      ]),
    ]),
  image: ({ className, slots, imageStyle }) =>
    h('section', { class: className }, [
      h('div', {
        class: 'slidev-layout-image slidev-layout-image-full',
        style: imageStyle,
      }),
      h('div', { class: 'slidev-layout-image-content' }, [slots.default?.()]),
    ]),
  'image-left': ({ className, slots, imageStyle }) =>
    h('section', { class: className }, [
      h('div', { class: 'slidev-layout-image', style: imageStyle }),
      h('div', { class: 'slidev-layout-image-content' }, [slots.default?.()]),
    ]),
  'image-right': ({ className, slots, imageStyle }) =>
    h('section', { class: className }, [
      h('div', { class: 'slidev-layout-image-content' }, [slots.default?.()]),
      h('div', { class: 'slidev-layout-image', style: imageStyle }),
    ]),
  iframe: ({ className, slots, iframeUrl }) =>
    h('section', { class: className }, [
      iframeUrl === null ? slots.default?.() : renderIframe(iframeUrl),
    ]),
  'iframe-left': ({ className, slots, iframeUrl }) =>
    h('section', { class: className }, [
      iframeUrl === null ? null : renderIframe(iframeUrl),
      h('div', { class: 'slidev-layout-iframe-content' }, [slots.default?.()]),
    ]),
  'iframe-right': ({ className, slots, iframeUrl }) =>
    h('section', { class: className }, [
      h('div', { class: 'slidev-layout-iframe-content' }, [slots.default?.()]),
      iframeUrl === null ? null : renderIframe(iframeUrl),
    ]),
}

export default defineComponent({
  name: 'SlideLayoutHost',
  props: {
    slide: {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      type: Object as PropType<RenderedSlide>,
      required: true,
    },
  },
  setup(props) {
    const layoutName = computed(() => props.slide.layout)
    const imageStyle = computed(() => {
      const image = props.slide.image ?? props.slide.backgroundImage
      return image !== undefined && image !== '' ? { backgroundImage: `url(${image})` } : undefined
    })
    const iframeUrl = computed(() => {
      const value = props.slide.parsedFrontmatter.url
      return value !== undefined && value !== '' ? value : null
    })

    return () => {
      const slots: SlotMap = Object.fromEntries(
        Object.entries(props.slide.slotComponents).map(([name, component]) => [
          name,
          renderSlotComponent(component),
        ]),
      )

      const ctx: LayoutContext = {
        className: ['slidev-layout', `slidev-layout-${layoutName.value}`, props.slide.class],
        slots,
        imageStyle: imageStyle.value,
        iframeUrl: iframeUrl.value,
      }

      const renderer = layoutRenderers[layoutName.value] ?? defaultSection
      return renderer(ctx)
    }
  },
})
