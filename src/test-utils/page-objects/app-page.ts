import type { RenderAppOptions, RenderedApp } from '../app-browser'
import { decodeDeck, pressKey, renderApp, settleApp, setMarkdown } from '../app-browser'

interface AppPageOptions {
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

    expectSlideHeading: (title: string) => {
      expect(this.screen.getByRole('heading', { name: title, exact: true })).toBeTruthy()
    },

    expectIframeLayoutVisible: (url: string) => {
      const iframe = this.container.querySelector(`iframe[src="${url}"]`)
      expect(iframe instanceof HTMLIFrameElement).toBe(true)
    },

    expectCodeHighlightedLines: (lines: string[]) => {
      const highlighted = [
        ...this.container.querySelectorAll<HTMLElement>('.slidev-code-frame .line.highlighted'),
      ]
        .map((line) => line.dataset.line)
        .filter((line): line is string => line !== undefined)
      expect(highlighted).toEqual(lines)
    },

    expectCodeLineNumber: (line: string) => {
      const lineElement = this.container.querySelector(
        `.slidev-code-frame .line[data-line="${line}"]`,
      )
      expect(lineElement instanceof HTMLElement).toBe(true)
    },
  }

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

  get container() {
    return this.app.screen.container
  }

  get screen() {
    return this.app.screen
  }

  get shareSpy() {
    return this.app.shareSpy
  }

  [Symbol.dispose]() {
    this.app[Symbol.dispose]()
  }

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

  async updateMarkdown(markdown: string) {
    await setMarkdown(this.screen, markdown)
  }

  async setPreviewWidth(width: number) {
    this.setPreviewWidthStyles(width)
    window.dispatchEvent(new Event('resize'))
    await settleApp()
    await settleApp()
  }

  measurePreviewWidths() {
    const previewSlide = this.container.querySelector('.preview-slide')
    const slideContent = this.container.querySelector('.preview-slide .slidev-slide-content')

    if (!(previewSlide instanceof HTMLElement) || !(slideContent instanceof HTMLElement)) {
      throw new Error('Expected preview slide and slide content to exist')
    }

    return {
      previewWidth: previewSlide.getBoundingClientRect().width,
      contentWidth: slideContent.getBoundingClientRect().width,
    }
  }

  measureSlideCanvas() {
    const slideContent = this.container.querySelector('.preview-slide .slidev-slide-content')

    if (!(slideContent instanceof HTMLElement)) {
      throw new Error('Expected preview slide content to exist')
    }

    return {
      width: slideContent.style.width,
      height: slideContent.style.height,
    }
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

  expectFontFamilyVar(kind: 'sans' | 'mono', value: string) {
    expect(document.documentElement.style.getPropertyValue(`--slidev-fonts-${kind}`)).toContain(
      value,
    )
  }

  expectFontLinkLoaded() {
    const fontLink = document.querySelector('#slidev-playground-fonts')
    expect(fontLink instanceof HTMLLinkElement && fontLink.href).toContain('fonts.googleapis.com')
  }

  expectDarkMode(enabled = true) {
    expect(document.documentElement.classList.contains('dark')).toBe(enabled)
  }

  expectThemePrimary(value: string) {
    expect(document.documentElement.style.getPropertyValue('--slidev-theme-primary')).toBe(value)
  }

  expectHashPresent() {
    expect(window.location.hash).toBeTruthy()
  }

  expectIframeLayoutVisible(url: string) {
    const iframe = this.container.querySelector(`iframe[src="${url}"]`)
    expect(iframe instanceof HTMLIFrameElement).toBe(true)
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

  getSharedMarkdown() {
    return decodeDeck(window.location.hash.slice(1))
  }

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
