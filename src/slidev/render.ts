import type { Component } from 'vue'
import katex from '@traptitech/markdown-it-katex'
import MarkdownIt from 'markdown-it'
import { compile, defineComponent, markRaw } from 'vue'
import SlidevCodeBlock from '../components/SlidevCodeBlock.vue'
import SlidevErrorBlock from '../components/SlidevErrorBlock.vue'
import SlidevMermaidBlock from '../components/SlidevMermaidBlock.vue'
import { processClicks } from '../click-processor'
import type { SlidevConfig } from '../composables/useHeadmatter'
import { escapeHtml, escapeHtmlAttribute } from '../string-utils'
import { extractStyles, scopeCSS } from '../style-extractor'
import type { RenderedSlide, SlideSlotMap } from '../types'
import { parseFenceInfo } from './fences'
import type { ResolvedSlideSource } from './imports'
import { splitSlideSlots } from './slots'

interface RenderMarkdownOptions {
  lineNumbers: boolean
}

interface RenderMarkdownResult {
  codeClicks: number
  html: string
}

const compiledComponentCache = new Map<string, Component>()

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: false,
})

md.use(katex)

md.renderer.rules.heading_open = (tokens, idx, options, _env, self) => {
  const token = tokens[idx]
  token.attrJoin('class', 'slidev-heading')
  return self.renderToken(tokens, idx, options)
}

export function renderSlides(
  slides: ResolvedSlideSource[],
  config: SlidevConfig,
  rootDefaults: Record<string, unknown>,
): RenderedSlide[] {
  return slides.map((slide, index) => renderSlide(slide, index, config, rootDefaults))
}

function renderSlide(
  slide: ResolvedSlideSource,
  index: number,
  config: SlidevConfig,
  rootDefaults: Record<string, unknown>,
): RenderedSlide {
  const frontmatter = mergeFrontmatter(rootDefaults, slide.frontmatter)
  const slots = splitSlideSlots(slide.content)
  const slotComponents: SlideSlotMap = {}

  let clickOffset = 0
  let codeClicks = 0
  let scopedStyles = ''

  for (const slot of slots) {
    const { content: cleanedContent, styles } = extractStyles(slot.content)
    const rendered = renderMarkdown(cleanedContent, {
      lineNumbers: Boolean(frontmatter.lineNumbers ?? config.lineNumbers),
    })
    const { html: clickableHtml, totalClicks } = processClicks(rendered.html)

    clickOffset = Math.max(clickOffset, totalClicks)
    codeClicks = Math.max(codeClicks, rendered.codeClicks)
    if (styles.length > 0) {
      const scopeId = `slidev-scope-${index}`
      scopedStyles += `${styles.map((css) => scopeCSS(css, scopeId)).join('\n')}\n`
    }

    slotComponents[slot.name] = compileSlideTemplate(clickableHtml)
  }

  const background = getString(frontmatter.background)
  const backgroundImage = getString(frontmatter.backgroundImage)
  const image = getString(frontmatter.image)

  return {
    layout: resolveLayout(frontmatter.layout, index),
    transition: getString(frontmatter.transition),
    note: slide.note ?? '',
    background,
    backgroundImage,
    image,
    class: normalizeClassName(frontmatter.class),
    scopeId: `slidev-scope-${index}`,
    scopedStyles: scopedStyles.trim() || undefined,
    totalClicks: Math.max(clickOffset, codeClicks),
    filepath: slide.filepath,
    frontmatter,
    slotComponents,
  }
}

function compileSlideTemplate(html: string): Component {
  const template = `<div class="slidev-markdown">${html}</div>`

  const cached = compiledComponentCache.get(template)
  if (cached) {
    return cached
  }

  try {
    const render = compile(template)
    const component = markRaw(
      defineComponent({
        name: 'CompiledSlideSlot',
        components: {
          SlidevCodeBlock,
          SlidevErrorBlock,
          SlidevMermaidBlock,
        },
        render,
      }),
    )
    compiledComponentCache.set(template, component)
    return component
  } catch (error) {
    const fallback = markRaw(
      defineComponent({
        name: 'CompiledSlideSlotError',
        components: { SlidevErrorBlock },
        data: () => ({
          message:
            error instanceof Error
              ? error.message
              : 'Failed to compile the rendered slide template.',
        }),
        template: '<SlidevErrorBlock :message="message" />',
      }),
    )
    compiledComponentCache.set(template, fallback)
    return fallback
  }
}

function renderMarkdown(content: string, options: RenderMarkdownOptions): RenderMarkdownResult {
  let codeClicks = 0

  md.renderer.rules.fence = (tokens, idx) => {
    const token = tokens[idx]
    const { codeClicks: fenceCodeClicks, html } = renderFence(token.info, token.content, options)
    codeClicks = Math.max(codeClicks, fenceCodeClicks)
    return html
  }

  const rendered = md.render(content)
  delete md.renderer.rules.fence

  return {
    codeClicks,
    html: rendered,
  }
}

function renderFence(
  rawInfo: string,
  code: string,
  options: RenderMarkdownOptions,
): { codeClicks: number; html: string } {
  const info = parseFenceInfo(rawInfo)
  const normalizedCode = code.replace(/\n$/, '')

  if (info.language === 'mermaid') {
    return {
      codeClicks: 0,
      html: `<slidev-mermaid-block code="${encodeURIComponent(normalizedCode)}"></slidev-mermaid-block>`,
    }
  }

  if (!info.language) {
    return {
      codeClicks: 0,
      html: `<pre><code>${escapeHtml(normalizedCode)}</code></pre>`,
    }
  }

  const highlightSteps =
    info.highlightSteps.length > 0 ? info.highlightSteps : [info.highlightedLines]
  const highlightStepsAttribute =
    highlightSteps.length > 0
      ? ` highlight-steps="${escapeHtmlAttribute(JSON.stringify(highlightSteps))}"`
      : ''
  const startLine = info.startLine ?? 1

  return {
    codeClicks: Math.max(0, highlightSteps.length - 1),
    html: `<slidev-code-block code="${encodeURIComponent(
      normalizedCode,
    )}" language="${escapeHtmlAttribute(info.language)}"${
      info.filename ? ` filename="${escapeHtmlAttribute(info.filename)}"` : ''
    }${highlightStepsAttribute} line-numbers="${String(info.lineNumbers ?? options.lineNumbers)}" start-line="${String(startLine)}"></slidev-code-block>`,
  }
}

function mergeFrontmatter(
  defaults: Record<string, unknown>,
  frontmatter: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...defaults,
    ...frontmatter,
  }
}

function resolveLayout(layout: unknown, index: number): string {
  if (typeof layout === 'string' && layout !== '') {
    return layout
  }
  return index === 0 ? 'cover' : 'default'
}

function normalizeClassName(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value
  }
  if (Array.isArray(value)) {
    return value.filter((entry) => typeof entry === 'string').join(' ') || undefined
  }
  return undefined
}

function getString(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined
}
