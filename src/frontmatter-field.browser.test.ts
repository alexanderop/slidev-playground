import type { Ref, WritableComputedRef } from 'vue'
import { createApp, defineComponent, h, nextTick, provide, ref } from 'vue'
import { markdownKey } from './config/injection-keys'
import { useFrontmatterField } from './features/editor/composables/useFrontmatterField'

type Harness<T extends Record<string, WritableComputedRef<unknown>>> = {
  markdown: Ref<string>
  fields: T
  [Symbol.dispose]: () => void
}

function mountField<T extends Record<string, WritableComputedRef<unknown>>>(
  initial: string,
  builder: () => T,
): Harness<T> {
  const markdown = ref(initial)
  let fields: T | null = null

  const Consumer = defineComponent({
    setup() {
      fields = builder()
      return () => h('div')
    },
  })

  const Host = defineComponent({
    setup() {
      provide(markdownKey, markdown)
      return () => h(Consumer)
    },
  })

  const app = createApp(Host)
  const mountPoint = document.createElement('div')
  document.body.append(mountPoint)
  app.mount(mountPoint)

  if (fields === null) {
    throw new Error('Harness builder did not run')
  }
  const resolved = fields

  return {
    markdown,
    fields: resolved,
    [Symbol.dispose]: () => {
      app.unmount()
      mountPoint.remove()
    },
  }
}

it('Given markdown When reading a string field Then the value reflects the frontmatter', () => {
  using harness = mountField('---\ntitle: Hello\n---\n', () => ({
    title: useFrontmatterField('title'),
  }))

  expect(harness.fields.title.value).toBe('Hello')
})

it('Given a string field When set to empty string and allowEmpty is default Then property is removed', async () => {
  using harness = mountField('---\ntitle: Hello\n---\n\nBody', () => ({
    title: useFrontmatterField('title'),
  }))

  harness.fields.title.value = ''
  await nextTick()

  expect(harness.markdown.value).not.toContain('title:')
})

it('Given a string field with allowEmpty When set to empty Then property is kept with empty value', async () => {
  using harness = mountField('---\ntitle: Hello\n---\n\nBody', () => ({
    primary: useFrontmatterField('themeConfig.primary', { default: '#fff', allowEmpty: true }),
  }))

  harness.fields.primary.value = ''
  await nextTick()

  expect(harness.markdown.value).toContain("primary: ''")
})

it('Given a number field When reading an unparsed value Then default is used', () => {
  using harness = mountField('---\ntitle: Hi\n---\n', () => ({
    contrast: useFrontmatterField('themeConfig.contrast', {
      type: 'number',
      default: 72,
      min: 30,
      max: 100,
    }),
  }))

  expect(harness.fields.contrast.value).toBe(72)
})

it('Given a number field When set above max Then value is clamped on write', async () => {
  using harness = mountField('---\ntitle: Hi\n---\n\nBody', () => ({
    contrast: useFrontmatterField('themeConfig.contrast', {
      type: 'number',
      default: 72,
      min: 30,
      max: 100,
      integer: true,
    }),
  }))

  harness.fields.contrast.value = 150
  await nextTick()

  expect(harness.markdown.value).toContain('contrast: 100')
})

it('Given a number field When set below min Then value is clamped on write', async () => {
  using harness = mountField('---\ntitle: Hi\n---\n\nBody', () => ({
    contrast: useFrontmatterField('themeConfig.contrast', {
      type: 'number',
      default: 72,
      min: 30,
      max: 100,
      integer: true,
    }),
  }))

  harness.fields.contrast.value = 10
  await nextTick()

  expect(harness.markdown.value).toContain('contrast: 30')
})

it('Given a number field When set to a non-finite value Then write is rejected', async () => {
  using harness = mountField('---\ncontrast: 50\n---\n\nBody', () => ({
    contrast: useFrontmatterField('themeConfig.contrast', {
      type: 'number',
      default: 72,
    }),
  }))

  harness.fields.contrast.value = Number.NaN
  await nextTick()

  expect(harness.markdown.value).toContain('contrast: 50')
})

it('Given a number field with integer When set to a float Then value is truncated', async () => {
  using harness = mountField('---\ntitle: Hi\n---\n\nBody', () => ({
    contrast: useFrontmatterField('themeConfig.contrast', {
      type: 'number',
      default: 72,
      integer: true,
    }),
  }))

  harness.fields.contrast.value = 65.7
  await nextTick()

  expect(harness.markdown.value).toContain('contrast: 65')
})

it('Given an enum field When the raw value is not in the whitelist Then default is returned', () => {
  using harness = mountField('---\ncolorSchema: plaid\n---\n', () => ({
    schema: useFrontmatterField('colorSchema', {
      type: 'enum',
      values: ['auto', 'light', 'dark'] as const,
      default: 'auto',
    }),
  }))

  expect(harness.fields.schema.value).toBe('auto')
})

it('Given an enum field When set to an invalid value Then the write is rejected', async () => {
  using harness = mountField('---\ncolorSchema: light\n---\n\nBody', () => ({
    schema: useFrontmatterField('colorSchema', {
      type: 'enum',
      values: ['auto', 'light', 'dark'] as const,
      default: 'auto',
    }),
  }))

  harness.fields.schema.value = 'plaid'
  await nextTick()

  expect(harness.markdown.value).toContain('colorSchema: light')
})

it('Given an enum field with parse When the raw value is a legacy shape Then parse normalizes it', () => {
  using harness = mountField('---\naspectRatio: 1.3333\n---\n', () => ({
    ratio: useFrontmatterField('aspectRatio', {
      type: 'enum',
      values: ['16:9', '4:3', '1:1'] as const,
      default: '16:9',
      parse: (raw) => {
        if (typeof raw === 'number' && Math.abs(raw - 4 / 3) < 0.001) {
          return '4:3'
        }
        return undefined
      },
    }),
  }))

  expect(harness.fields.ratio.value).toBe('4:3')
})

it('Given a string field with parse When the raw value is an array Then parse extracts the primary item', () => {
  using harness = mountField("---\nfonts:\n  sans: ['Inter', 'sans-serif']\n---\n", () => ({
    sans: useFrontmatterField('fonts.sans', {
      parse: (raw) => (Array.isArray(raw) ? String(raw[0] ?? '') : ''),
    }),
  }))

  expect(harness.fields.sans.value).toBe('Inter')
})

it('Given a string field When setting to the same value Then no markdown mutation occurs', async () => {
  using harness = mountField('---\ntitle: Hello\n---\n\nBody', () => ({
    title: useFrontmatterField('title'),
  }))

  const before = harness.markdown.value
  harness.fields.title.value = 'Hello'
  await nextTick()

  expect(harness.markdown.value).toBe(before)
})

it('Given two separate markdown refs Then their parse caches do not cross-contaminate', () => {
  using harnessA = mountField('---\ntitle: Alpha\n---\n', () => ({
    title: useFrontmatterField('title'),
  }))
  using harnessB = mountField('---\ntitle: Beta\n---\n', () => ({
    title: useFrontmatterField('title'),
  }))

  expect(harnessA.fields.title.value).toBe('Alpha')
  expect(harnessB.fields.title.value).toBe('Beta')
})

it('Given an external markdown mutation When the field is re-read Then the new value is visible', async () => {
  using harness = mountField('---\ntitle: Alpha\n---\n\nBody', () => ({
    title: useFrontmatterField('title'),
  }))

  harness.markdown.value = '---\ntitle: Beta\n---\n\nBody'
  await nextTick()

  expect(harness.fields.title.value).toBe('Beta')
})
