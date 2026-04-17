import type { Ref, WritableComputedRef } from 'vue'
import { computed, inject } from 'vue'
import { markdownKey } from '../../../config/injection-keys'
import type { YamlScalar } from '../frontmatter/core'
import { applyPatch, readPath } from '../frontmatter/core'

export type StringSchema = {
  type?: 'string'
  default?: string
  allowEmpty?: boolean
  parse?: (raw: unknown) => string
}

export type NumberSchema = {
  type: 'number'
  default: number
  min?: number
  max?: number
  integer?: boolean
}

export type EnumSchema<T extends string> = {
  type: 'enum'
  values: readonly T[]
  default: T
  parse?: (raw: unknown) => T | undefined
}

export function useFrontmatterField(
  path: string,
  schema?: StringSchema,
): WritableComputedRef<string>
export function useFrontmatterField(path: string, schema: NumberSchema): WritableComputedRef<number>
export function useFrontmatterField<T extends string>(
  path: string,
  schema: EnumSchema<T>,
): WritableComputedRef<T>
export function useFrontmatterField<T extends string>(
  path: string,
  schema?: StringSchema | NumberSchema | EnumSchema<T>,
): WritableComputedRef<string> | WritableComputedRef<number> | WritableComputedRef<T> {
  const markdown = inject(markdownKey)
  if (!markdown) {
    throw new Error('useFrontmatterField requires markdownKey to be provided')
  }

  if (schema && schema.type === 'number') {
    return buildNumberField(markdown, path, schema)
  }
  if (schema && schema.type === 'enum') {
    return buildEnumField(markdown, path, schema)
  }
  return buildStringField(markdown, path, schema)
}

type FieldCache = { markdown: string; values: Map<string, unknown> }
const fieldCaches = new WeakMap<Ref<string>, FieldCache>()

function readCached(markdown: Ref<string>, path: string): unknown {
  const current = markdown.value
  let cache = fieldCaches.get(markdown)
  if (!cache || cache.markdown !== current) {
    cache = { markdown: current, values: new Map() }
    fieldCaches.set(markdown, cache)
  }
  if (!cache.values.has(path)) {
    cache.values.set(path, readPath(current, path))
  }
  return cache.values.get(path)
}

function writeSet(markdown: Ref<string>, path: string, value: YamlScalar) {
  const current = readCached(markdown, path)
  if (current === value) {
    return
  }
  markdown.value = applyPatch(markdown.value, { op: 'set', path, value })
}

function writeRemove(markdown: Ref<string>, path: string) {
  const current = readCached(markdown, path)
  if (current === undefined) {
    return
  }
  markdown.value = applyPatch(markdown.value, { op: 'remove', path })
}

function buildStringField(
  markdown: Ref<string>,
  path: string,
  schema: StringSchema | undefined,
): WritableComputedRef<string> {
  const fallback = schema?.default ?? ''
  const parse = schema?.parse
  const allowEmpty = schema?.allowEmpty ?? false

  return computed<string>({
    get: () => {
      const raw = readCached(markdown, path)
      if (parse) {
        return parse(raw)
      }
      return typeof raw === 'string' ? raw : fallback
    },
    set: (next) => {
      if (typeof next !== 'string') {
        return
      }
      if (next === '' && !allowEmpty) {
        writeRemove(markdown, path)
        return
      }
      writeSet(markdown, path, next)
    },
  })
}

function buildNumberField(
  markdown: Ref<string>,
  path: string,
  schema: NumberSchema,
): WritableComputedRef<number> {
  return computed<number>({
    get: () => {
      const raw = readCached(markdown, path)
      if (typeof raw === 'number' && Number.isFinite(raw)) {
        return raw
      }
      if (typeof raw === 'string' && raw !== '') {
        const parsed = Number(raw)
        if (Number.isFinite(parsed)) {
          return parsed
        }
      }
      return schema.default
    },
    set: (next) => {
      const coerced = typeof next === 'string' ? Number(next) : next
      if (typeof coerced !== 'number' || !Number.isFinite(coerced)) {
        return
      }
      let value = coerced
      if (schema.integer === true) {
        value = Math.trunc(value)
      }
      if (schema.min !== undefined) {
        value = Math.max(schema.min, value)
      }
      if (schema.max !== undefined) {
        value = Math.min(schema.max, value)
      }
      writeSet(markdown, path, value)
    },
  })
}

function buildEnumField<T extends string>(
  markdown: Ref<string>,
  path: string,
  schema: EnumSchema<T>,
): WritableComputedRef<T> {
  const isAllowed = (value: unknown): value is T =>
    typeof value === 'string' && (schema.values as readonly string[]).includes(value)

  return computed<T>({
    get: () => {
      const raw = readCached(markdown, path)
      if (isAllowed(raw)) {
        return raw
      }
      if (schema.parse) {
        const parsed = schema.parse(raw)
        if (parsed !== undefined && isAllowed(parsed)) {
          return parsed
        }
      }
      return schema.default
    },
    set: (next) => {
      if (!isAllowed(next)) {
        return
      }
      writeSet(markdown, path, next)
    },
  })
}
