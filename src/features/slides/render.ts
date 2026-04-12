import type { Component } from 'vue'
import MarkdownIt from 'markdown-it'
import { compile, defineComponent, inject, markRaw } from 'vue'
import SlidevArrow from './components/SlidevArrow.vue'
import SlidevAutoFitText from './components/SlidevAutoFitText.vue'
import SlidevCodeBlock from './components/SlidevCodeBlock.vue'
import SlidevCodeGroup from './components/SlidevCodeGroup.vue'
import SlidevErrorBlock from './components/SlidevErrorBlock.vue'
import SlidevIcon from './components/SlidevIcon.vue'
import SlidevKatexBlock from './components/SlidevKatexBlock.vue'
import SlidevLightOrDark from './components/SlidevLightOrDark.vue'
import SlidevLink from './components/SlidevLink.vue'
import SlidevMark from './components/SlidevMark.vue'
import SlidevMagicMove from './components/SlidevMagicMove.vue'
import SlidevMermaidBlock from './components/SlidevMermaidBlock.vue'
import SlidevPlantUmlBlock from './components/SlidevPlantUmlBlock.vue'
import SlidevPoweredBy from './components/SlidevPoweredBy.vue'
import SlidevSlideCurrentNo from './components/SlidevSlideCurrentNo.vue'
import SlidevSlidesTotal from './components/SlidevSlidesTotal.vue'
import SlidevTransform from './components/SlidevTransform.vue'
import SlidevVideo from './components/SlidevVideo.vue'
import SlidevYoutube from './components/SlidevYoutube.vue'
import { processClicks } from './click-processor'
import type { SlidevConfig } from '../../composables/useHeadmatter'
import { defaultSlidevNav, slidevNavKey } from '../../config/injection-keys'
import { escapeHtml, escapeHtmlAttribute } from '../../utils/string-utils'
import { extractStyles, scopeCSS } from './style-extractor'
import type { RenderedSlide, SlideFrontmatter, SlideSlotMap } from '../../types'
import { asScopeId, asSlideFilepath, asSlotName } from '../../types/brand'
import type { ScopeId, SlotName } from '../../types/brand'
import { parseFenceInfo } from './fences'
import { SlideFrontmatterSchema } from './frontmatter-schema'
import type { ResolvedSlideSource } from './imports'
import type { KatexPluginResult } from './katex-plugin'
import { katexPlugin } from './katex-plugin'
import { splitSlideSlots } from './slots'

type RenderMarkdownOptions = {
  readonly lineNumbers: boolean
}

type RenderMarkdownResult = {
  readonly codeClicks: number
  readonly html: string
}

const compiledComponentCache = new Map<string, Component>()

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: false,
})

const katexResult: KatexPluginResult = { mathClicks: 0 }
katexPlugin(md, katexResult)

md.renderer.rules.heading_open = (tokens, idx, options, _env, self) => {
  const token = tokens[idx]
  token.attrJoin('class', 'slidev-heading')
  return self.renderToken(tokens, idx, options)
}

type FenceRenderEnv = {
  renderFence?: (info: string, content: string) => { codeClicks: number; html: string }
  codeClicks?: number
}

md.renderer.rules.fence = (tokens, idx, _options, env: FenceRenderEnv) => {
  const token = tokens[idx]
  if (!env.renderFence) {
    return `<pre><code>${escapeHtml(token.content.replace(/\n$/, ''))}</code></pre>`
  }
  const { codeClicks: fenceCodeClicks, html } = env.renderFence(token.info, token.content)
  env.codeClicks = Math.max(env.codeClicks ?? 0, fenceCodeClicks)
  return html
}

export function clearComponentCache() {
  compiledComponentCache.clear()
}

export function renderSlides(
  slides: readonly ResolvedSlideSource[],
  config: SlidevConfig,
  rootDefaults: Readonly<Record<string, unknown>>,
  customComponents?: Readonly<Record<string, Component>>,
): RenderedSlide[] {
  return slides.map((slide, index) =>
    renderSlide(slide, index, config, rootDefaults, customComponents),
  )
}

function renderSlide(
  slide: ResolvedSlideSource,
  index: number,
  config: SlidevConfig,
  rootDefaults: Readonly<Record<string, unknown>>,
  customComponents?: Readonly<Record<string, Component>>,
): RenderedSlide {
  const frontmatter = mergeFrontmatter(rootDefaults, slide.frontmatter)
  const parseResult = SlideFrontmatterSchema.safeParse(frontmatter)
  const fm: SlideFrontmatter = parseResult.success ? parseResult.data : {}
  const slots = splitSlideSlots(slide.content)
  const slotComponents: Record<SlotName, Component | undefined> = {}

  let clickOffset = 0
  let codeClicks = 0
  let scopedStyles = ''
  const scopeId: ScopeId = asScopeId(`slidev-scope-${index}`)

  for (const slot of slots) {
    const { content: cleanedContent, styles } = extractStyles(slot.content)
    const rendered = renderMarkdown(cleanedContent, {
      lineNumbers: Boolean(fm.lineNumbers ?? config.lineNumbers),
    })
    const { html: clickableHtml, totalClicks } = processClicks(rendered.html)

    clickOffset = Math.max(clickOffset, totalClicks)
    codeClicks = Math.max(codeClicks, rendered.codeClicks)
    if (styles.length > 0) {
      scopedStyles += `${styles.map((css) => scopeCSS(css, scopeId)).join('\n')}\n`
    }

    slotComponents[asSlotName(slot.name)] = compileSlideTemplate(clickableHtml, customComponents)
  }

  return {
    layout: resolveLayout(fm.layout, index),
    transition: fm.transition,
    note: slide.note ?? '',
    background: fm.background,
    backgroundImage: fm.backgroundImage,
    image: fm.image,
    class: normalizeClassName(fm.class),
    scopeId,
    scopedStyles: scopedStyles.trim() || undefined,
    totalClicks: Math.max(clickOffset, codeClicks),
    filepath: asSlideFilepath(slide.filepath),
    parsedFrontmatter: fm,
    slotComponents: slotComponents as SlideSlotMap,
  }
}

function compileSlideTemplate(
  html: string,
  customComponents?: Readonly<Record<string, Component>>,
): Component {
  const rewrittenHtml = html.replaceAll('$slidev.nav', 'nav')
  const template = `<div class="slidev-markdown">${rewrittenHtml}</div>`

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
          SlidevIcon,
          SlidevKatexBlock,
          SlidevMagicMove,
          SlidevMermaidBlock,
          SlidevPlantUmlBlock,
          Arrow: SlidevArrow,
          AutoFitText: SlidevAutoFitText,
          autofittext: SlidevAutoFitText,
          CodeGroup: SlidevCodeGroup,
          codegroup: SlidevCodeGroup,
          Youtube: SlidevYoutube,
          PoweredBySlidev: SlidevPoweredBy,
          VMark: SlidevMark,
          SlideCurrentNo: SlidevSlideCurrentNo,
          slidecurrentno: SlidevSlideCurrentNo,
          SlidesTotal: SlidevSlidesTotal,
          slidestotal: SlidevSlidesTotal,
          Transform: SlidevTransform,
          transform: SlidevTransform,
          LightOrDark: SlidevLightOrDark,
          lightordark: SlidevLightOrDark,
          SlidevVideo,
          slidevvideo: SlidevVideo,
          SlidevLink,
          slidevlink: SlidevLink,
          ...customComponents,
        },
        setup() {
          const nav = inject(slidevNavKey, defaultSlidevNav)
          return {
            nav: {
              next: nav.next,
              prev: nav.prev,
              nextSlide: nav.nextSlide,
              prevSlide: nav.prevSlide,
              goToSlide: nav.goToSlide,
              openInEditor: () => {},
            },
          }
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
  katexResult.mathClicks = 0

  const { content: preprocessed, magicMoveClicks } = preprocessMagicMove(content)
  codeClicks = Math.max(codeClicks, magicMoveClicks)

  const { content: withCodeGroups, codeClicks: codeGroupClicks } = preprocessCodeGroups(
    preprocessed,
    options,
  )
  codeClicks = Math.max(codeClicks, codeGroupClicks)

  const withIcons = transformIconTags(withCodeGroups)
  const env: FenceRenderEnv = {
    renderFence: (info, fenceContent) => renderFence(info, fenceContent, options),
    codeClicks: 0,
  }
  const rendered = md.render(withIcons, env)
  codeClicks = Math.max(codeClicks, env.codeClicks ?? 0)
  codeClicks = Math.max(codeClicks, katexResult.mathClicks)

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

  if (info.language === 'plantuml') {
    return {
      codeClicks: 0,
      html: `<slidev-plant-uml-block code="${encodeURIComponent(normalizedCode)}"></slidev-plant-uml-block>`,
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
      info.filename !== null && info.filename !== undefined && info.filename !== ''
        ? ` filename="${escapeHtmlAttribute(info.filename)}"`
        : ''
    }${highlightStepsAttribute} line-numbers="${String(info.lineNumbers ?? options.lineNumbers)}" start-line="${String(startLine)}"></slidev-code-block>`,
  }
}

function mergeFrontmatter(
  defaults: Readonly<Record<string, unknown>>,
  frontmatter: Readonly<Record<string, unknown>>,
): Record<string, unknown> {
  return {
    ...defaults,
    ...frontmatter,
  }
}

function resolveLayout(layout: string | undefined, index: number): string {
  if (layout !== undefined && layout !== '') {
    return layout
  }
  return index === 0 ? 'cover' : 'default'
}

function normalizeClassName(value: string | readonly string[] | undefined): string | undefined {
  if (typeof value === 'string') {
    return value
  }
  if (Array.isArray(value)) {
    return value.join(' ') || undefined
  }
  return undefined
}

function preprocessMagicMove(content: string): { content: string; magicMoveClicks: number } {
  let magicMoveClicks = 0
  const magicMoveRegex = /````+md\s+magic-move(?:\s+\{[^}]*\})?\s*\n([\s\S]*?)````+/g

  const result = content.replaceAll(magicMoveRegex, (_match, inner: string) => {
    const steps: Array<{ code: string; lang: string }> = []
    const codeBlockRegex = /```(\w*)[^\n]*\n([\s\S]*?)```/g
    let codeMatch: RegExpExecArray | null

    while ((codeMatch = codeBlockRegex.exec(inner)) !== null) {
      steps.push({
        code: codeMatch[2].replace(/\n$/, ''),
        lang: codeMatch[1] || 'typescript',
      })
    }

    if (steps.length === 0) {
      return ''
    }

    magicMoveClicks = Math.max(magicMoveClicks, steps.length - 1)
    const stepsEncoded = encodeURIComponent(JSON.stringify(steps))
    return `<slidev-magic-move steps="${stepsEncoded}" lang="${steps[0].lang}"></slidev-magic-move>`
  })

  return { content: result, magicMoveClicks }
}

function preprocessCodeGroups(
  content: string,
  options: RenderMarkdownOptions,
): { content: string; codeClicks: number } {
  let codeClicks = 0
  const codeGroupRegex = /<CodeGroup>\s*([\s\S]*?)\s*<\/CodeGroup>/gi

  const result = content.replaceAll(codeGroupRegex, (_match, inner: string) => {
    const codeBlockRegex = /```([^\n]*)\n([\s\S]*?)```/g
    const blocks: string[] = []
    let blockMatch: RegExpExecArray | null

    while ((blockMatch = codeBlockRegex.exec(inner)) !== null) {
      const fenceInfo = blockMatch[1]
      const code = blockMatch[2].replace(/\n$/, '')
      const { codeClicks: blockClicks, html } = renderFence(fenceInfo, code, options)
      codeClicks = Math.max(codeClicks, blockClicks)
      blocks.push(html)
    }

    return `<div>\n<codegroup>${blocks.join('\n')}</codegroup>\n</div>`
  })

  return { content: result, codeClicks }
}

function transformIconTags(html: string): string {
  return html.replaceAll(
    /<([\w-]+):([\w-]+)\s*\/>/g,
    (_match, collection: string, name: string) =>
      `<slidev-icon collection="${escapeHtmlAttribute(collection)}" name="${escapeHtmlAttribute(name)}"></slidev-icon>`,
  )
}
