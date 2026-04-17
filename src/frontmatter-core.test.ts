import { applyPatch, readPath } from './features/editor/frontmatter/core'
import type { FmPatch } from './features/editor/frontmatter/core'

type PatchCase = {
  name: string
  markdown: string
  patch: FmPatch
  expected: string
}

const patchCases: PatchCase[] = [
  {
    name: 'set scalar at existing top-level path',
    markdown: '---\ntitle: Old\n---\n\nBody',
    patch: { op: 'set', path: 'title', value: 'New' },
    expected: '---\ntitle: New\n---\n\nBody',
  },
  {
    name: 'set scalar at previously-absent top-level path',
    markdown: '---\ntitle: Old\n---\n\nBody',
    patch: { op: 'set', path: 'aspectRatio', value: '16:9' },
    expected: "---\ntitle: Old\naspectRatio: '16:9'\n---\n\nBody",
  },
  {
    name: 'set scalar at nested previously-absent path',
    markdown: '---\ntitle: Old\n---\n\nBody',
    patch: { op: 'set', path: 'themeConfig.primary', value: '#ff0000' },
    expected: "---\ntitle: Old\nthemeConfig:\n  primary: '#ff0000'\n---\n\nBody",
  },
  {
    name: 'set scalar at existing nested path',
    markdown: '---\nthemeConfig:\n  primary: "#abc"\n---\n\nBody',
    patch: { op: 'set', path: 'themeConfig.primary', value: '#def' },
    expected: "---\nthemeConfig:\n  primary: '#def'\n---\n\nBody",
  },
  {
    name: 'preserves comment on existing line when updating',
    markdown: '---\ntitle: Old # keep me\n---\n\nBody',
    patch: { op: 'set', path: 'title', value: 'New' },
    expected: '---\ntitle: New # keep me\n---\n\nBody',
  },
  {
    name: 'preserves indent when creating nested path',
    markdown: '---\nfonts:\n  sans: Inter\n---\n\nBody',
    patch: { op: 'set', path: 'fonts.mono', value: 'Fira Code' },
    expected: '---\nfonts:\n  sans: Inter\n  mono: Fira Code\n---\n\nBody',
  },
  {
    name: 'quotes strings containing colons',
    markdown: '---\nfoo: bar\n---\n\nBody',
    patch: { op: 'set', path: 'foo', value: 'a:b' },
    expected: "---\nfoo: 'a:b'\n---\n\nBody",
  },
  {
    name: 'quotes YAML keywords on set',
    markdown: '---\nflag: 1\n---\n\nBody',
    patch: { op: 'set', path: 'flag', value: 'true' },
    expected: "---\nflag: 'true'\n---\n\nBody",
  },
  {
    name: 'quotes strings beginning with digits',
    markdown: '---\nratio: old\n---\n\nBody',
    patch: { op: 'set', path: 'ratio', value: '16:9' },
    expected: "---\nratio: '16:9'\n---\n\nBody",
  },
  {
    name: 'sets array value with flow style',
    markdown: '---\ntitle: Hi\n---\n\nBody',
    patch: { op: 'set', path: 'fonts.sans', value: ['Inter', 'sans-serif'] },
    expected: '---\ntitle: Hi\nfonts:\n  sans: [Inter, sans-serif]\n---\n\nBody',
  },
  {
    name: 'sets numeric value without quoting',
    markdown: '---\ntitle: Hi\n---\n\nBody',
    patch: { op: 'set', path: 'canvasWidth', value: 1200 },
    expected: '---\ntitle: Hi\ncanvasWidth: 1200\n---\n\nBody',
  },
  {
    name: 'sets boolean value without quoting',
    markdown: '---\ntitle: Hi\n---\n\nBody',
    patch: { op: 'set', path: 'drawings', value: true },
    expected: '---\ntitle: Hi\ndrawings: true\n---\n\nBody',
  },
  {
    name: 'remove leaf at top-level',
    markdown: '---\ntitle: Old\naspectRatio: "16:9"\n---\n\nBody',
    patch: { op: 'remove', path: 'title' },
    expected: '---\naspectRatio: "16:9"\n---\n\nBody',
  },
  {
    name: 'remove leaf prunes empty parent',
    markdown: '---\ntitle: Old\nthemeConfig:\n  primary: "#abc"\n---\n\nBody',
    patch: { op: 'remove', path: 'themeConfig.primary' },
    expected: '---\ntitle: Old\n---\n\nBody',
  },
  {
    name: 'remove leaf leaves non-empty parent alone',
    markdown: '---\nfonts:\n  sans: Inter\n  mono: Fira\n---\n\nBody',
    patch: { op: 'remove', path: 'fonts.sans' },
    expected: '---\nfonts:\n  mono: Fira\n---\n\nBody',
  },
  {
    name: 'remove the only frontmatter entry drops the whole block',
    markdown: '---\ntitle: Old\n---\n\nBody',
    patch: { op: 'remove', path: 'title' },
    expected: 'Body',
  },
  {
    name: 'remove missing path is a no-op',
    markdown: '---\ntitle: Hi\n---\n\nBody',
    patch: { op: 'remove', path: 'doesNotExist' },
    expected: '---\ntitle: Hi\n---\n\nBody',
  },
  {
    name: 'identity round-trip when patch is no-op on read-back',
    markdown: '---\ntitle: Hi\nfonts:\n  sans: Inter\n---\n\nBody',
    patch: { op: 'set', path: 'title', value: 'Hi' },
    expected: '---\ntitle: Hi\nfonts:\n  sans: Inter\n---\n\nBody',
  },
]

for (const { name, markdown, patch, expected } of patchCases) {
  it(`applyPatch: ${name}`, () => {
    expect(applyPatch(markdown, patch)).toBe(expected)
  })
}

it('applyPatch: quotes strings with leading whitespace', () => {
  const result = applyPatch('---\nfoo: bar\n---\n', { op: 'set', path: 'foo', value: '  pad' })
  expect(result).toContain("foo: '  pad'")
})

it('applyPatch: escapes single quotes by doubling when quoting is forced', () => {
  const result = applyPatch('---\nfoo: bar\n---\n', { op: 'set', path: 'foo', value: "a'b:c" })
  expect(result).toContain("foo: 'a''b:c'")
})

it('applyPatch: ignores empty path', () => {
  const md = '---\nfoo: bar\n---\n'
  expect(applyPatch(md, { op: 'set', path: '', value: 'x' })).toBe(md)
})

it('readPath: returns string value', () => {
  expect(readPath('---\ntitle: Hello\n---\n', 'title')).toBe('Hello')
})

it('readPath: returns number value for unquoted digits', () => {
  expect(readPath('---\ncanvasWidth: 1200\n---\n', 'canvasWidth')).toBe(1200)
})

it('readPath: returns boolean for true/false keywords', () => {
  expect(readPath('---\nflag: true\n---\n', 'flag')).toBe(true)
  expect(readPath('---\nflag: false\n---\n', 'flag')).toBe(false)
})

it('readPath: returns null for null keyword and tilde', () => {
  expect(readPath('---\nfoo: null\n---\n', 'foo')).toBeNull()
  expect(readPath('---\nfoo: ~\n---\n', 'foo')).toBeNull()
})

it('readPath: unquotes single-quoted strings', () => {
  expect(readPath("---\nratio: '16:9'\n---\n", 'ratio')).toBe('16:9')
})

it('readPath: unquotes double-quoted strings', () => {
  expect(readPath('---\ncolor: "#abc"\n---\n', 'color')).toBe('#abc')
})

it('readPath: reads nested path', () => {
  const md = '---\nthemeConfig:\n  primary: "#ff0000"\n  contrast: 72\n---\n'
  expect(readPath(md, 'themeConfig.primary')).toBe('#ff0000')
  expect(readPath(md, 'themeConfig.contrast')).toBe(72)
})

it('readPath: returns undefined for missing path', () => {
  expect(readPath('---\ntitle: Hi\n---\n', 'missing')).toBeUndefined()
})

it('readPath: returns undefined for absent intermediate key', () => {
  expect(readPath('---\ntitle: Hi\n---\n', 'themeConfig.primary')).toBeUndefined()
})

it('readPath: decodes flow array of strings', () => {
  expect(readPath("---\nfonts:\n  sans: ['Inter', 'sans-serif']\n---\n", 'fonts.sans')).toEqual([
    'Inter',
    'sans-serif',
  ])
})

it('readPath: numeric-looking strings stay numbers', () => {
  expect(readPath('---\nratio: 1.333\n---\n', 'ratio')).toBeCloseTo(1.333)
})

it('readPath: returns undefined when no frontmatter', () => {
  expect(readPath('Just body text', 'title')).toBeUndefined()
})
