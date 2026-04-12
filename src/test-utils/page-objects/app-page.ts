import type { RenderAppOptions, RenderedApp } from '../app-browser'
import { pressKey, renderApp, settleApp, setMarkdown } from '../app-browser'
import { CodeBlockQuery } from './code-block-query'
import { MeasurementHelper } from './measurement-helper'
import { ShareAssertions } from './share-assertions'
import { ThemeAssertions } from './theme-assertions'

export async function waitForSelector(container: Element, selector: string, timeoutMs = 2000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const element = container.querySelector(selector)
    if (element) {
      return element
    }
    // eslint-disable-next-line no-await-in-loop
    await settleApp()
  }
  throw new Error(`Timed out waiting for selector: ${selector}`)
}

type AppPageOptions = {
  previewWidth?: number
}

export class AppPage {
  readonly styleSettings = {
    expectOpen: () => {
      expect(this.screen.getByRole('dialog', { name: 'Style settings' })).toBeTruthy()
    },

    setDarkMode: async () => {
      await this.screen.getByRole('button', { name: 'Dark', exact: true }).click()
      await settleApp()
    },

    setAutoMode: async () => {
      await this.screen.getByRole('button', { name: 'Auto', exact: true }).click()
      await settleApp()
    },

    setPrimaryColor: async (color: string) => {
      const colorHexInput = this.container.querySelector('.color-hex')
      if (!(colorHexInput instanceof HTMLInputElement)) {
        throw new Error('Expected primary color text input to exist')
      }

      colorHexInput.value = color
      colorHexInput.dispatchEvent(new Event('input', { bubbles: true }))
      await settleApp()
    },

    setCanvasWidth: async (width: number) => {
      const input = this.screen.getByRole('spinbutton', { name: 'Canvas width' })
      await input.fill(String(width))
      await settleApp()
    },

    setAspectRatio: async (ratio: '16:9' | '4:3' | '1:1') => {
      const select = this.screen.getByRole('combobox', { name: 'Aspect ratio' })
      await select.selectOptions(ratio)
      await settleApp()
    },
  }

  readonly presentation = {
    expectOpen: () => {
      expect(this.screen.getByRole('dialog', { name: 'Presentation mode' })).toBeTruthy()
    },

    expectSlidePosition: (position: string) => {
      expect(this.screen.getByText(position)).toBeTruthy()
    },

    expectClickPosition: (position: string) => {
      expect(this.screen.getByText(position)).toBeTruthy()
    },

    next: async () => {
      await this.screen.getByRole('button', { name: 'Next' }).click()
      await settleApp()
    },

    pressKey: async (key: string) => {
      await pressKey(key)
    },

    pressShortcut: async (
      key: string,
      options: { code?: string; shiftKey?: boolean; repeat?: boolean } = {},
    ) => {
      await pressKey(key, options)
    },

    expectSpeakerNotesVisible: () => {
      expect(this.screen.getByRole('region', { name: 'Speaker Notes' })).toBeTruthy()
    },

    expectSpeakerNotesText: (text: string) => {
      expect(this.screen.getByText(text)).toBeTruthy()
    },

    expectOverviewOpen: () => {
      expect(this.screen.getByRole('dialog', { name: 'Slide overview' })).toBeTruthy()
    },

    openOverview: async () => {
      await pressKey('o')
    },

    jumpToSlide: async (slideNumber: number) => {
      await this.screen.getByRole('button', { name: `Jump to slide ${slideNumber}` }).click()
      await settleApp()
    },

    expectGotoOpen: () => {
      expect(this.screen.getByRole('dialog', { name: 'Goto slide' })).toBeTruthy()
    },

    searchGoto: async (query: string) => {
      const input = this.screen.getByRole('textbox', { name: 'Goto slide' })
      await input.fill(query)
      await settleApp()
    },

    expectTextHidden: (text: string) => {
      const element = this.findVisibleTextElement(text, false)
      expect(element).toBeTruthy()
      expect(element?.classList.contains('v-click-hidden')).toBe(true)
    },

    expectTextVisible: (text: string) => {
      const element = this.findVisibleTextElement(text, true)
      expect(element).toBeTruthy()
      expect(element?.classList.contains('v-click-visible')).toBe(true)
    },

    expectSlideCentered: () => {
      const slideContent = this.container.querySelector('.present-slide .slidev-slide-content')
      if (!(slideContent instanceof HTMLElement)) {
        throw new Error('Expected presentation slide content to exist')
      }
      const rect = slideContent.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      expect(Math.abs(centerX - window.innerWidth / 2)).toBeLessThan(10)
      expect(Math.abs(centerY - window.innerHeight / 2)).toBeLessThan(10)
    },

    expectSlideHeading: (title: string) => {
      expect(this.screen.getByRole('heading', { name: title, exact: true })).toBeTruthy()
    },

    expectIframeLayoutVisible: (url: string) => {
      this.expectIframeLayoutVisible(url)
    },

    expectCodeHighlightedLines: (lines: string[]) => {
      this.expectCodeHighlightedLines(lines)
    },

    expectCodeDishonoredLines: (lines: string[]) => {
      this.expectCodeDishonoredLines(lines)
    },

    expectCodeLineNumber: (line: string) => {
      this.expectCodeLineNumber(line)
    },
  }

  readonly measure = new MeasurementHelper(() => this.container)
  readonly theme = new ThemeAssertions()
  readonly sharing = new ShareAssertions()

  private constructor(private readonly app: RenderedApp) {}

  static async render(options: RenderAppOptions = {}, pageOptions: AppPageOptions = {}) {
    const app = new AppPage(renderApp(options))
    if (pageOptions.previewWidth !== undefined) {
      app.setPreviewWidthStyles(pageOptions.previewWidth)
    }
    await settleApp()
    await settleApp()
    return app
  }

  get clipboardSpy() {
    return this.app.clipboardSpy
  }

  get alertSpy() {
    return this.app.alertSpy
  }

  get container() {
    return this.app.screen.container
  }

  get screen() {
    return this.app.screen
  }

  get shareSpy() {
    return this.app.shareSpy
  }

  get requestFullscreenSpy() {
    return this.app.requestFullscreenSpy
  }

  get exitFullscreenSpy() {
    return this.app.exitFullscreenSpy
  }

  [Symbol.dispose]() {
    this.app[Symbol.dispose]()
  }

  // --- Code block queries ---

  codeBlock(index: number) {
    return new CodeBlockQuery(this.container, index)
  }

  async waitForCodeBlocks() {
    await waitForSelector(this.container, '.slidev-code-frame .line')
  }

  expectCodeTitle(title: string) {
    expect(this.screen.getByText(title)).toBeTruthy()
  }

  expectCodeLineNumber(line: string) {
    const lineElement = this.container.querySelector(
      `.slidev-code-frame .line[data-line="${line}"]`,
    )
    expect(lineElement instanceof HTMLElement).toBe(true)
  }

  expectCodeHighlightedLines(lines: string[]) {
    const highlighted = [
      ...this.container.querySelectorAll<HTMLElement>('.slidev-code-frame .line.highlighted'),
    ]
      .map((line) => line.dataset.line)
      .filter((line): line is string => line !== undefined)
    expect(highlighted).toEqual(lines)
  }

  expectCodeDishonoredLines(lines: string[]) {
    const dishonored = [
      ...this.container.querySelectorAll<HTMLElement>('.slidev-code-frame .line.dishonored'),
    ]
      .map((line) => line.dataset.line)
      .filter((line): line is string => line !== undefined)
    expect(dishonored).toEqual(lines)
  }

  expectNoDishonoredLines() {
    const dishonored = this.container.querySelectorAll('.slidev-code-frame .line.dishonored')
    expect(dishonored.length).toBe(0)
  }

  expectShikiDualThemeVars() {
    const pre = this.container.querySelector<HTMLElement>('.slidev-code-frame pre.shiki')
    expect(pre).toBeTruthy()
    expect(pre?.style.getPropertyValue('--shiki-light')).toBeTruthy()
    expect(pre?.style.getPropertyValue('--shiki-dark')).toBeTruthy()
  }

  expectCodeBlockBackground() {
    const pre = this.container.querySelector('.slidev-code-frame pre')
    expect(pre instanceof HTMLElement).toBe(true)
    if (pre instanceof HTMLElement) {
      expect(pre.style.backgroundColor).toBe('')
    }
  }

  // --- Slide queries ---

  expectSlideCount(count: number) {
    expect(this.screen.getByText(`${count} slides`)).toBeTruthy()
  }

  expectSlideVisible(title: string) {
    expect(this.screen.getByRole('heading', { name: title, exact: true })).toBeTruthy()
  }

  expectPreviewSlideAction(slideNumber: number) {
    expect(
      this.screen.getByRole('button', {
        name: `Open slide ${slideNumber} in presentation`,
      }),
    ).toBeTruthy()
  }

  expectIframeLayoutVisible(url: string) {
    const iframe = this.container.querySelector(`iframe[src="${url}"]`)
    expect(iframe instanceof HTMLIFrameElement).toBe(true)
  }

  // --- Actions ---

  async updateMarkdown(markdown: string) {
    await setMarkdown(this.screen, markdown)
  }

  async setPreviewWidth(width: number) {
    this.setPreviewWidthStyles(width)
    window.dispatchEvent(new Event('resize'))
    await settleApp()
    await settleApp()
  }

  async openStyleSettings() {
    await this.screen.getByTitle('Style settings').click()
    await settleApp()
    return this.styleSettings
  }

  async present() {
    await this.screen.getByRole('button', { name: 'Present', exact: true }).click()
    await settleApp()
    await settleApp()
    return this.presentation
  }

  async share() {
    await this.screen.getByRole('button', { name: 'Share' }).click()
    await settleApp()
  }

  async pressShortcut(
    key: string,
    options: { code?: string; shiftKey?: boolean; repeat?: boolean } = {},
  ) {
    await pressKey(key, options)
  }

  // --- Measurement (delegated to this.measure) ---

  measurePreviewWidths() {
    return this.measure.previewWidths()
  }

  measureSlideCanvas() {
    return this.measure.slideCanvas()
  }

  // --- Theme/font assertions (delegated to this.theme) ---

  expectFontFamilyVar(kind: 'sans' | 'mono', value: string) {
    this.theme.expectFontFamilyVar(kind, value)
  }

  expectFontLinkLoaded() {
    this.theme.expectFontLinkLoaded()
  }

  expectDarkMode(enabled = true) {
    this.theme.expectDarkMode(enabled)
  }

  expectThemePrimary(value: string) {
    this.theme.expectThemePrimary(value)
  }

  // --- Share assertions (delegated to this.sharing) ---

  expectHashPresent() {
    this.sharing.expectHashPresent()
  }

  getSharedMarkdown() {
    return this.sharing.getSharedMarkdown()
  }

  getSharedState() {
    return this.sharing.getSharedState()
  }

  // --- Component file tabs ---

  async switchToFileTab(name: string) {
    await this.screen.getByRole('button', { name, exact: true }).click()
    await settleApp()
  }

  async switchToSlidesTab() {
    await this.switchToFileTab('slides.md')
  }

  async addComponentFile() {
    await this.screen.getByRole('button', { name: 'Add component' }).click()
    await settleApp()
  }

  async updateActiveFile(content: string) {
    await setMarkdown(this.screen, content)
    await settleApp()
  }

  // --- Private ---

  private setPreviewWidthStyles(width: number) {
    const px = `${width}px`
    document.documentElement.style.width = px
    document.body.style.width = px
    this.screen.container.style.width = px
  }

  private findVisibleTextElement(text: string, presentationOnly = false) {
    const candidates = [...this.container.querySelectorAll<HTMLElement>('*')]
    return (
      candidates.find((element) => {
        if (element.textContent?.trim() !== text) {
          return false
        }
        return !presentationOnly || Boolean(element.closest('.present-overlay'))
      }) ?? null
    )
  }
}
