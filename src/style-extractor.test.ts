import { extractStyles, scopeCSS } from './style-extractor'

describe('extractStyles', () => {
  it('returns unchanged content when no style blocks', () => {
    const result = extractStyles('<h1>Hello</h1><p>World</p>')
    expect(result.content).toBe('<h1>Hello</h1><p>World</p>')
    expect(result.styles).toEqual([])
  })

  it('extracts a single style block', () => {
    const result = extractStyles('<h1>Hello</h1><style>h1 { color: red; }</style>')
    expect(result.content).toBe('<h1>Hello</h1>')
    expect(result.styles).toEqual(['h1 { color: red; }'])
  })

  it('extracts multiple style blocks', () => {
    const result = extractStyles(
      '<h1>Hello</h1><style>h1 { color: red; }</style><p>text</p><style>p { font-size: 2em; }</style>',
    )
    expect(result.content).toBe('<h1>Hello</h1><p>text</p>')
    expect(result.styles).toEqual(['h1 { color: red; }', 'p { font-size: 2em; }'])
  })

  it('handles <style scoped> attribute', () => {
    const result = extractStyles('<h1>Hello</h1><style scoped>h1 { color: red; }</style>')
    expect(result.content).toBe('<h1>Hello</h1>')
    expect(result.styles).toEqual(['h1 { color: red; }'])
  })

  it('skips empty style blocks', () => {
    const result = extractStyles('<h1>Hello</h1><style>  </style>')
    expect(result.content).toBe('<h1>Hello</h1>')
    expect(result.styles).toEqual([])
  })

  it('handles empty input', () => {
    const result = extractStyles('')
    expect(result.content).toBe('')
    expect(result.styles).toEqual([])
  })
})

describe('scopeCSS', () => {
  it('prefixes simple selectors', () => {
    const result = scopeCSS('h1 { color: red; }', 'scope-0')
    expect(result).toContain('#scope-0 h1')
    expect(result).toContain('color: red;')
  })

  it('handles comma-separated selectors', () => {
    const result = scopeCSS('h1, h2 { color: red; }', 'scope-0')
    expect(result).toContain('#scope-0 h1')
    expect(result).toContain('#scope-0 h2')
  })

  it('handles nested selectors', () => {
    const result = scopeCSS('.parent .child { color: red; }', 'scope-0')
    expect(result).toContain('#scope-0 .parent .child')
  })

  it('passes through @keyframes unchanged', () => {
    const result = scopeCSS(
      '@keyframes fade { from { opacity: 0; } to { opacity: 1; } }',
      'scope-0',
    )
    expect(result).toContain('@keyframes fade')
    expect(result).not.toContain('#scope-0')
  })

  it('scopes selectors inside @media blocks', () => {
    const result = scopeCSS('@media (max-width: 600px) { h1 { color: red; } }', 'scope-0')
    expect(result).toContain('@media (max-width: 600px)')
    expect(result).toContain('#scope-0 h1')
  })

  it('replaces :root with scope ID', () => {
    const result = scopeCSS(':root { --color: red; }', 'scope-0')
    expect(result).toContain('#scope-0')
    expect(result).not.toContain(':root')
  })
})
