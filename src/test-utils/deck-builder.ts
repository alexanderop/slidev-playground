/* eslint-disable max-classes-per-file */
interface Frontmatter {
  title?: string
  fonts?: { sans?: string; mono?: string }
  themeConfig?: { primary?: string }
  colorSchema?: 'light' | 'dark'
  canvasWidth?: number
  aspectRatio?: string
  [key: string]: unknown
}

interface CodeBlockOptions {
  lang?: string
  filename?: string
  highlights?: string
  lines?: boolean
  startLine?: number
}

interface SlideOptions {
  layout?: string
  src?: string
  class?: string
  url?: string
}

class SlideBuilder {
  private lines: string[] = []
  private options: SlideOptions = {}
  private noteText?: string

  constructor(private heading?: string) {}

  text(content: string): this {
    this.lines.push(content)
    return this
  }

  click(content: string): this {
    this.lines.push(`<div v-click>${content}</div>`)
    return this
  }

  clickAfter(content: string): this {
    this.lines.push(`<div v-after>${content}</div>`)
    return this
  }

  mark(content: string, options: { type?: string; color?: string; at?: number } = {}): this {
    const attrs: string[] = []
    if (options.type !== undefined && options.type !== '') {
      attrs.push(`type="${options.type}"`)
    }
    if (options.color !== undefined && options.color !== '') {
      attrs.push(`color="${options.color}"`)
    }
    if (options.at !== undefined) {
      attrs.push(`at="${options.at}"`)
    }
    const attrStr = attrs.length > 0 ? ` ${attrs.join(' ')}` : ''
    this.lines.push(`<v-mark${attrStr}>${content}</v-mark>`)
    return this
  }

  clicks(items: string[]): this {
    this.lines.push('<ul v-clicks>')
    for (const item of items) {
      this.lines.push(`  <li>${item}</li>`)
    }
    this.lines.push('</ul>')
    return this
  }

  code(source: string, options: CodeBlockOptions = {}): this {
    const { lang = 'ts', filename, highlights, lines, startLine } = options
    let meta = ''
    if (filename !== null && filename !== undefined && filename !== '') {
      meta += ` [${filename}]`
    }
    if (lines === true || (startLine !== null && startLine !== undefined && startLine !== 0)) {
      const parts: string[] = []
      if (lines === true) {
        parts.push('lines:true')
      }
      if (startLine !== null && startLine !== undefined && startLine !== 0) {
        parts.push(`startLine:${startLine}`)
      }
      meta += ` {${parts.join(',')}}`
    }
    if (highlights !== null && highlights !== undefined && highlights !== '') {
      meta += `${meta ? '' : ' '}{${highlights}}`
    }

    const opener = `\`\`\`${lang}${meta}`
    this.lines.push(opener)
    this.lines.push(source)
    this.lines.push('```')
    return this
  }

  note(text: string): this {
    this.noteText = text
    return this
  }

  layout(name: string): this {
    this.options.layout = name
    return this
  }

  slideClass(name: string): this {
    this.options.class = name
    return this
  }

  import(src: string): this {
    this.options.src = src
    return this
  }

  iframeUrl(url: string): this {
    this.options.url = url
    this.options.layout = this.options.layout ?? 'iframe-right'
    return this
  }

  /** @internal */
  _hasOptions(): boolean {
    return Object.keys(this.options).length > 0
  }

  /** @internal — returns per-slide YAML lines (without ---) */
  _buildOptions(): string {
    return Object.entries(this.options)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n')
  }

  /** @internal — returns body content (heading + lines + note) */
  _buildBody(): string {
    const parts: string[] = []
    if (this.heading !== null && this.heading !== undefined && this.heading !== '') {
      parts.push(`# ${this.heading}`)
    }
    if (this.lines.length > 0) {
      parts.push(this.lines.join('\n'))
    }
    if (this.noteText !== null && this.noteText !== undefined && this.noteText !== '') {
      parts.push(`<!--\n${this.noteText}\n-->`)
    }
    return parts.join('\n\n')
  }
}

export class DeckBuilder {
  private frontmatter: Frontmatter = {}
  private slides: SlideBuilder[] = []

  title(title: string): this {
    this.frontmatter.title = title
    return this
  }

  fonts(fonts: { sans?: string; mono?: string }): this {
    this.frontmatter.fonts = fonts
    return this
  }

  theme(primary: string): this {
    this.frontmatter.themeConfig = { primary }
    return this
  }

  colorSchema(schema: 'light' | 'dark'): this {
    this.frontmatter.colorSchema = schema
    return this
  }

  canvasWidth(width: number): this {
    this.frontmatter.canvasWidth = width
    return this
  }

  aspectRatio(ratio: string): this {
    this.frontmatter.aspectRatio = ratio
    return this
  }

  meta(key: string, value: unknown): this {
    this.frontmatter[key] = value
    return this
  }

  slide(heading?: string, configure?: (slide: SlideBuilder) => void): this {
    const slide = new SlideBuilder(heading)
    configure?.(slide)
    this.slides.push(slide)
    return this
  }

  build(): string {
    const chunks: string[] = []

    // Deck frontmatter
    const hasFrontmatter = Object.keys(this.frontmatter).length > 0
    if (hasFrontmatter) {
      chunks.push(`---\n${buildYaml(this.frontmatter)}---`)
    }

    for (const [i, slide] of this.slides.entries()) {
      const isFirst = i === 0
      const body = slide._buildBody()
      const hasOptions = slide._hasOptions()
      const needsSeparator = !isFirst

      if (needsSeparator && hasOptions) {
        chunks.push(`---\n${slide._buildOptions()}\n---`)
      }
      if (needsSeparator && !hasOptions) {
        chunks.push('---')
      }
      if (!needsSeparator && hasOptions && !hasFrontmatter) {
        chunks.push(`---\n${slide._buildOptions()}\n---`)
      }

      if (body) {
        chunks.push(body)
      }
    }

    return chunks.join('\n\n') + '\n'
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function buildYaml(obj: Record<string, unknown>, indent = 0): string {
  const prefix = '  '.repeat(indent)
  let yaml = ''
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue
    }
    if (isRecord(value)) {
      yaml += `${prefix}${key}:\n`
      yaml += buildYaml(value, indent + 1)
      continue
    }
    if (typeof value === 'string') {
      yaml += `${prefix}${key}: '${value}'\n`
      continue
    }
    yaml += `${prefix}${key}: ${JSON.stringify(value)}\n`
  }
  return yaml
}

export function deck(): DeckBuilder {
  return new DeckBuilder()
}
