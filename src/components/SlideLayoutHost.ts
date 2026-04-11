import type { Component, VNode } from 'vue'
import { computed, defineComponent, h } from 'vue'
import type { RenderedSlide } from '../types'

function renderSlotComponent(component?: Component): (() => VNode | null) | undefined {
  if (!component) {
    return undefined
  }
  return () => h(component)
}

export default defineComponent({
  name: 'SlideLayoutHost',
  props: {
    slide: {
      type: Object as () => RenderedSlide,
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
      const value = props.slide.frontmatter.url
      return typeof value === 'string' && value !== '' ? value : null
    })

    return () => {
      const slots = Object.fromEntries(
        Object.entries(props.slide.slotComponents).map(([name, component]) => [
          name,
          renderSlotComponent(component),
        ]),
      )

      const className = ['slidev-layout', `slidev-layout-${layoutName.value}`, props.slide.class]

      switch (layoutName.value) {
        case 'cover':
        case 'center':
        case 'section':
        case 'statement':
        case 'fact':
          return h('section', { class: className }, [slots.default?.()])
        case 'quote':
          return h('section', { class: className }, [h('blockquote', [slots.default?.()])])
        case 'intro':
        case 'end':
        case '404':
        case 'error':
          return h('section', { class: className }, [slots.default?.()])
        case 'full':
        case 'none':
          return h('section', { class: className }, [slots.default?.()])
        case 'two-cols':
          return h('section', { class: className }, [
            h('div', { class: 'slidev-layout-main' }, [slots.default?.()]),
            h('div', { class: 'slidev-layout-side' }, [slots.right?.()]),
          ])
        case 'two-cols-header':
          return h('section', { class: className }, [
            h('header', { class: 'slidev-layout-header' }, [slots.header?.()]),
            h('div', { class: 'slidev-layout-body' }, [
              h('div', { class: 'slidev-layout-main' }, [slots.default?.()]),
              h('div', { class: 'slidev-layout-side' }, [slots.right?.()]),
            ]),
          ])
        case 'image':
          return h('section', { class: className }, [
            h('div', {
              class: 'slidev-layout-image slidev-layout-image-full',
              style: imageStyle.value,
            }),
            h('div', { class: 'slidev-layout-image-content' }, [slots.default?.()]),
          ])
        case 'image-left':
          return h('section', { class: className }, [
            h('div', { class: 'slidev-layout-image', style: imageStyle.value }),
            h('div', { class: 'slidev-layout-image-content' }, [slots.default?.()]),
          ])
        case 'image-right':
          return h('section', { class: className }, [
            h('div', { class: 'slidev-layout-image-content' }, [slots.default?.()]),
            h('div', { class: 'slidev-layout-image', style: imageStyle.value }),
          ])
        case 'iframe':
          return h('section', { class: className }, [
            iframeUrl.value === null
              ? slots.default?.()
              : h('iframe', {
                  class: 'slidev-layout-iframe-frame',
                  src: iframeUrl.value,
                  title: 'Embedded slide content',
                }),
          ])
        case 'iframe-left':
          return h('section', { class: className }, [
            iframeUrl.value === null
              ? null
              : h('iframe', {
                  class: 'slidev-layout-iframe-frame',
                  src: iframeUrl.value,
                  title: 'Embedded slide content',
                }),
            h('div', { class: 'slidev-layout-iframe-content' }, [slots.default?.()]),
          ])
        case 'iframe-right':
          return h('section', { class: className }, [
            h('div', { class: 'slidev-layout-iframe-content' }, [slots.default?.()]),
            iframeUrl.value === null
              ? null
              : h('iframe', {
                  class: 'slidev-layout-iframe-frame',
                  src: iframeUrl.value,
                  title: 'Embedded slide content',
                }),
          ])
        default:
          return h('section', { class: className }, [slots.default?.()])
      }
    }
  },
})
