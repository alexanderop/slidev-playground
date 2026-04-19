import type { Component, Ref } from 'vue'
import {
  compile,
  computed,
  defineComponent,
  markRaw,
  onScopeDispose,
  ref,
  watch,
  watchEffect,
} from 'vue'
import { useClipboard, useDebounceFn, useShare } from '@vueuse/core'
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import { z } from 'zod/mini'

import { DEBOUNCE_URL_MS } from '../config/constants'
import SlidevErrorBlock from '../features/slides/components/SlidevErrorBlock.vue'

const STYLE_TAG_ID = 'slidev-custom-component-styles'

const UrlStateSchema = z.object({
  m: z.string(),
  c: z.optional(z.record(z.string(), z.string())),
})

export type PlaygroundDefaults = {
  readonly markdown: string
  readonly componentFiles: Record<string, string>
}

export type PlaygroundCompileError = {
  readonly filename: string
  readonly componentName: string
  readonly phase: 'parse' | 'compile'
  readonly message: string
}

export type PlaygroundStateApi = {
  readonly markdown: Ref<string>
  readonly componentFiles: Ref<Record<string, string>>
  readonly customComponents: Readonly<Ref<Record<string, Component>>>
  readonly compileErrors: Readonly<Ref<readonly PlaygroundCompileError[]>>
  readonly share: () => Promise<void>
  readonly copied: Readonly<Ref<boolean>>
}

type DecodedState = {
  markdown: string
  componentFiles: Record<string, string>
}

type ParsedComponentDef = {
  filename: string
  name: string
  props: string[]
  template: string
  style: string
  parseError: string | null
}

type CompiledComponents = {
  components: Record<string, Component>
  styles: string
  errors: PlaygroundCompileError[]
}

export function usePlaygroundState(defaults: PlaygroundDefaults): PlaygroundStateApi {
  const initial = readInitialState(defaults)
  const markdown = ref(initial.markdown)
  const componentFiles = ref(initial.componentFiles)

  const compiled = computed(() => compileFromFiles(componentFiles.value))
  const customComponents = computed(() => compiled.value.components)
  const compileErrors = computed<readonly PlaygroundCompileError[]>(() => compiled.value.errors)

  installStyleTag(() => compiled.value.styles)

  const updateHash = useDebounceFn(() => {
    history.replaceState(null, '', `#${encodeState(markdown.value, componentFiles.value)}`)
  }, DEBOUNCE_URL_MS)

  watch(markdown, updateHash)
  watch(componentFiles, updateHash, { deep: true })

  const { copy, copied } = useClipboard({ legacy: true })
  const { share: nativeShare, isSupported: isShareSupported } = useShare()

  async function share() {
    window.location.hash = encodeState(markdown.value, componentFiles.value)
    const url = window.location.href

    if (isShareSupported.value) {
      await nativeShare({ title: 'Slidev Playground', url })
      return
    }

    await copy(url)
  }

  return {
    markdown,
    componentFiles,
    customComponents,
    compileErrors,
    share,
    copied,
  }
}

function readInitialState(defaults: PlaygroundDefaults): DecodedState {
  const hash = window.location.hash.slice(1)
  if (!hash) {
    return {
      markdown: defaults.markdown,
      componentFiles: { ...defaults.componentFiles },
    }
  }

  try {
    const raw = decompressFromEncodedURIComponent(hash)
    if (!raw) {
      return {
        markdown: defaults.markdown,
        componentFiles: { ...defaults.componentFiles },
      }
    }
    return decodeState(raw, defaults.markdown)
  } catch {
    return {
      markdown: defaults.markdown,
      componentFiles: { ...defaults.componentFiles },
    }
  }
}

function decodeState(raw: string, fallbackMarkdown: string): DecodedState {
  if (raw.startsWith('{')) {
    try {
      const result = UrlStateSchema.safeParse(JSON.parse(raw))
      if (result.success) {
        return {
          markdown: result.data.m,
          componentFiles: result.data.c ?? {},
        }
      }
      return { markdown: fallbackMarkdown, componentFiles: {} }
    } catch {
      return { markdown: fallbackMarkdown, componentFiles: {} }
    }
  }
  return { markdown: raw, componentFiles: {} }
}

function encodeState(markdown: string, componentFiles: Record<string, string>): string {
  const hasComponents = Object.keys(componentFiles).length > 0
  if (!hasComponents) {
    return compressToEncodedURIComponent(markdown)
  }
  return compressToEncodedURIComponent(JSON.stringify({ m: markdown, c: componentFiles }))
}

function installStyleTag(getStyles: () => string) {
  const tag = document.createElement('style')
  tag.id = STYLE_TAG_ID
  document.head.append(tag)
  watchEffect(() => {
    tag.textContent = getStyles()
  })
  onScopeDispose(() => {
    tag.remove()
  })
}

function compileFromFiles(files: Record<string, string>): CompiledComponents {
  const parsed = parseComponentFiles(files)
  return compileParsedComponents(parsed)
}

function parseComponentFiles(files: Record<string, string>): ParsedComponentDef[] {
  return Object.entries(files).map(([filename, content]) => {
    const name = filename.replace(/\.vue$/i, '')
    const template = extractBlock(content, 'template')
    const style = extractBlock(content, 'style')
    const { props, parseError } = parsePropsFromScript(content)

    return {
      filename,
      name,
      props,
      template,
      style,
      parseError,
    }
  })
}

function extractBlock(body: string, tag: 'template' | 'style'): string {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const match = re.exec(body)
  return match ? match[1].trim() : ''
}

type PropsParseResult = {
  props: string[]
  parseError: string | null
}

function parsePropsFromScript(body: string): PropsParseResult {
  const scriptMatch = /<script\s+setup[^>]*>([\s\S]*?)<\/script>/i.exec(body)
  if (!scriptMatch) {
    return { props: [], parseError: null }
  }
  const scriptContent = scriptMatch[1]

  if (!scriptContent.includes('defineProps')) {
    return { props: [], parseError: null }
  }

  const arrayMatch = /defineProps\(\s*\[([\s\S]*?)\]\s*\)/.exec(scriptContent)
  if (arrayMatch) {
    return {
      props: arrayMatch[1]
        .split(',')
        .map((p) => p.trim().replaceAll(/^['"]|['"]$/g, ''))
        .filter(Boolean),
      parseError: null,
    }
  }

  const objectMatch = /defineProps\(\s*\{([\s\S]*?)\}\s*\)/.exec(scriptContent)
  if (objectMatch) {
    return {
      props: objectMatch[1]
        .split(',')
        .map((entry) => entry.trim().split(/\s*:/)[0].trim())
        .filter(Boolean),
      parseError: null,
    }
  }

  const genericMatch = /defineProps<\s*\{([\s\S]*?)\}\s*>\s*\(\s*\)/.exec(scriptContent)
  if (genericMatch) {
    return {
      props: genericMatch[1]
        .split(/[;\n]/)
        .map((entry) =>
          entry
            .trim()
            .split(/\s*[?:]/)[0]
            .trim(),
        )
        .filter(Boolean),
      parseError: null,
    }
  }

  return {
    props: [],
    parseError: 'Could not parse defineProps — recognised forms are array, object, or generic.',
  }
}

function compileParsedComponents(defs: ParsedComponentDef[]): CompiledComponents {
  const components: Record<string, Component> = {}
  const styles: string[] = []
  const errors: PlaygroundCompileError[] = []

  for (const def of defs) {
    if (def.parseError !== null) {
      errors.push({
        filename: def.filename,
        componentName: def.name,
        phase: 'parse',
        message: def.parseError,
      })
    }

    if (!def.template) {
      const message = 'No <template> block found in the file.'
      errors.push({
        filename: def.filename,
        componentName: def.name,
        phase: 'parse',
        message,
      })
      registerComponent(components, def.name, createErrorComponent(def.name, message))
      continue
    }

    try {
      const render = compile(def.template)
      const propsConfig: Record<
        string,
        {
          type: (
            | StringConstructor
            | NumberConstructor
            | BooleanConstructor
            | ObjectConstructor
            | ArrayConstructor
          )[]
          default: undefined
        }
      > = {}
      for (const prop of def.props) {
        propsConfig[prop] = {
          type: [String, Number, Boolean, Object, Array],
          default: undefined,
        }
      }

      const component = markRaw(
        defineComponent({
          name: def.name,
          props: propsConfig,
          render,
        }),
      )
      registerComponent(components, def.name, component)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to compile template.'
      errors.push({
        filename: def.filename,
        componentName: def.name,
        phase: 'compile',
        message,
      })
      registerComponent(components, def.name, createErrorComponent(def.name, message))
    }

    if (def.style) {
      styles.push(def.style)
    }
  }

  return { components, styles: styles.join('\n'), errors }
}

function registerComponent(
  components: Record<string, Component>,
  name: string,
  component: Component,
): void {
  components[name] = component
  components[name.toLowerCase()] = component
}

function createErrorComponent(name: string, message: string): Component {
  return markRaw(
    defineComponent({
      name: `${name}Error`,
      components: { SlidevErrorBlock },
      data: () => ({ message: `Component "${name}": ${message}` }),
      template: '<SlidevErrorBlock :message="message" />',
    }),
  )
}
