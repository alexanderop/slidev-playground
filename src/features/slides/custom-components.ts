import type { Component } from 'vue'
import { compile, defineComponent, markRaw } from 'vue'
import SlidevErrorBlock from './components/SlidevErrorBlock.vue'

export interface ParsedComponentDef {
  name: string
  props: string[]
  template: string
  style: string
}

export interface CompiledCustomComponents {
  components: Record<string, Component>
  styles: string
}

export function parseComponentFiles(files: Record<string, string>): ParsedComponentDef[] {
  return Object.entries(files).map(([filename, content]) => {
    const name = filename.replace(/\.vue$/i, '')
    return parseSfc(name, content)
  })
}

function parseSfc(name: string, body: string): ParsedComponentDef {
  const props = parsePropsFromScript(body)
  let template = ''
  let style = ''

  const templateMatch = /<template>([\s\S]*?)<\/template>/i.exec(body)
  if (templateMatch) {
    template = templateMatch[1].trim()
  }

  const styleMatch = /<style>([\s\S]*?)<\/style>/i.exec(body)
  if (styleMatch) {
    style = styleMatch[1].trim()
  }

  return { name, props, template, style }
}

function parsePropsFromScript(body: string): string[] {
  const scriptMatch = /<script\s+setup>([\s\S]*?)<\/script>/i.exec(body)
  if (!scriptMatch) {
    return []
  }
  const scriptContent = scriptMatch[1]

  // Match defineProps(['a', 'b']) — array syntax
  const arrayMatch = /defineProps\(\s*\[([\s\S]*?)\]\s*\)/.exec(scriptContent)
  if (arrayMatch) {
    return arrayMatch[1]
      .split(',')
      .map((p) => p.trim().replaceAll(/^['"]|['"]$/g, ''))
      .filter(Boolean)
  }

  // Match defineProps({ a: String, b: Number }) — object syntax
  const objectMatch = /defineProps\(\s*\{([\s\S]*?)\}\s*\)/.exec(scriptContent)
  if (objectMatch) {
    return objectMatch[1]
      .split(',')
      .map((entry) => entry.trim().split(/\s*:/)[0].trim())
      .filter(Boolean)
  }

  // Match defineProps<{ a: string; b: string }>() — TypeScript generic syntax
  const genericMatch = /defineProps<\s*\{([\s\S]*?)\}\s*>\s*\(\s*\)/.exec(scriptContent)
  if (genericMatch) {
    return genericMatch[1]
      .split(/[;\n]/)
      .map((entry) =>
        entry
          .trim()
          .split(/\s*[?:]/)[0]
          .trim(),
      )
      .filter(Boolean)
  }

  return []
}

export function compileCustomComponents(defs: ParsedComponentDef[]): CompiledCustomComponents {
  const components: Record<string, Component> = {}
  const styles: string[] = []

  for (const def of defs) {
    if (!def.template) {
      components[def.name] = createErrorComponent(def.name, 'No <template> found')
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
      // Register under PascalCase and lowercase (markdown-it lowercases HTML tags)
      components[def.name] = component
      components[def.name.toLowerCase()] = component
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to compile template'
      const errorComponent = createErrorComponent(def.name, message)
      components[def.name] = errorComponent
      components[def.name.toLowerCase()] = errorComponent
    }

    if (def.style) {
      styles.push(def.style)
    }
  }

  return { components, styles: styles.join('\n') }
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
