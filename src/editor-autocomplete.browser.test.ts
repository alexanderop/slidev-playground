import { CompletionContext } from '@codemirror/autocomplete'
import { EditorState } from '@codemirror/state'
import { slidevCompletionSource } from './features/editor/composables/slidevAutocompletion'

function buildContext(doc: string, cursor?: number) {
  const pos = cursor ?? doc.length
  const state = EditorState.create({ doc })
  return new CompletionContext(state, pos, true)
}

it('Given frontmatter layout text When the completion source runs Then it suggests Slidev layout values', () => {
  const doc = `---\nlayout: ce\n---\n`
  const cursor = doc.indexOf('ce') + 'ce'.length
  const result = slidevCompletionSource(buildContext(doc, cursor))

  expect(result).toBeTruthy()
  if (!result) {
    return
  }
  expect(result.options.some((option) => option.label === 'center')).toBe(true)
  expect(result.options.some((option) => option.label === 'cover')).toBe(true)
  expect(doc.slice(result.from, cursor)).toBe('ce')
})

it('Given a partial click directive When the completion source runs Then it suggests click attributes', () => {
  const doc = '# Intro\n\n<div v-cl'
  const result = slidevCompletionSource(buildContext(doc))

  expect(result).toBeTruthy()
  if (!result) {
    return
  }
  expect(result.options.some((option) => option.label === 'v-click')).toBe(true)
  expect(result.options.some((option) => option.label === 'v-clicks')).toBe(true)
  expect(doc.slice(result.from)).toBe('v-cl')
})

it('Given an empty Slidev line When the completion source runs Then it offers the v-clicks scaffold snippet', () => {
  const doc = '# Intro\n\n'
  const result = slidevCompletionSource(buildContext(doc))

  expect(result).toBeTruthy()
  expect(result?.options.some((option) => option.label === 'v-clicks list')).toBe(true)
  expect(result?.options.some((option) => option.label === 'slide separator')).toBe(true)
})

it('Given an empty Slidev line When the completion source runs Then it offers deck structure scaffolds', () => {
  const doc = '# Intro\n\n'
  const result = slidevCompletionSource(buildContext(doc))

  expect(result).toBeTruthy()
  expect(result?.options.some((option) => option.label === 'frontmatter block')).toBe(true)
  expect(result?.options.some((option) => option.label === 'new slide')).toBe(true)
  expect(result?.options.some((option) => option.label === 'two-cols layout')).toBe(true)
  expect(result?.options.some((option) => option.label === 'iframe-right layout')).toBe(true)
})

it('Given an empty Slidev line When the completion source runs Then it offers code and note scaffolds', () => {
  const doc = '# Intro\n\n'
  const result = slidevCompletionSource(buildContext(doc))

  expect(result).toBeTruthy()
  expect(result?.options.some((option) => option.label === 'code block with filename')).toBe(true)
  expect(result?.options.some((option) => option.label === 'speaker notes with clicks')).toBe(true)
  expect(result?.options.some((option) => option.label === 'v-click at block')).toBe(true)
  expect(result?.options.some((option) => option.label === 'v-after.hide block')).toBe(true)
})

it('Given a component tag prefix When the completion source runs Then it suggests Slidev components', () => {
  const doc = '# Intro\n\n<Arr'
  const result = slidevCompletionSource(buildContext(doc))

  expect(result).toBeTruthy()
  expect(result?.options.some((option) => option.label === '<Arrow />')).toBe(true)
})

it('Given a click component tag prefix When the completion source runs Then it suggests click animation components', () => {
  const doc = '# Intro\n\n<v-cli'
  const result = slidevCompletionSource(buildContext(doc))

  expect(result).toBeTruthy()
  expect(result?.options.some((option) => option.label === '<v-click>')).toBe(true)
  expect(result?.options.some((option) => option.label === '<v-clicks>')).toBe(true)
})

it('Given a bare component name without a leading angle bracket When the completion source runs Then it still suggests click animation components', () => {
  const doc = '# Intro\n\nv-cli'
  const result = slidevCompletionSource(buildContext(doc))

  expect(result).toBeTruthy()
  if (!result) {
    return
  }
  expect(result.options.some((option) => option.label === '<v-click>')).toBe(true)
  expect(result.options.some((option) => option.label === '<v-clicks>')).toBe(true)
  expect(doc.slice(result.from)).toBe('v-cli')
})

it('Given a bare component name after leading whitespace When the completion source runs Then it suggests components anchored at the word', () => {
  const doc = '# Intro\n\n  Arr'
  const result = slidevCompletionSource(buildContext(doc))

  expect(result).toBeTruthy()
  if (!result) {
    return
  }
  expect(result.options.some((option) => option.label === '<Arrow />')).toBe(true)
  expect(doc.slice(result.from)).toBe('Arr')
})

it('Given a transition frontmatter key When the completion source runs Then it suggests transition values', () => {
  const doc = `---\ntransition: fa\n---\n`
  const cursor = doc.indexOf('fa') + 'fa'.length
  const result = slidevCompletionSource(buildContext(doc, cursor))

  expect(result).toBeTruthy()
  expect(result?.options.some((option) => option.label === 'fade')).toBe(true)
  expect(result?.options.some((option) => option.label === 'fade-out')).toBe(true)
})

it('Given an empty frontmatter key position When the completion source runs Then it suggests frontmatter keys', () => {
  const doc = `---\nlayout: cover\n\n---\n`
  // Cursor on the empty frontmatter line between "layout: cover" and closing "---"
  const cursor = doc.indexOf('\n\n---') + 1
  const result = slidevCompletionSource(buildContext(doc, cursor))

  expect(result).toBeTruthy()
  expect(result?.options.some((option) => option.label === 'title')).toBe(true)
  expect(result?.options.some((option) => option.label === 'theme')).toBe(true)
})
