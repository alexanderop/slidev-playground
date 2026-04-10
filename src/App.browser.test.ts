import { AppPage } from './test-utils/page-objects/app-page'

const TWO_SLIDE_DECK = `---
title: Browser flow test
fonts:
  sans: Poppins
  mono: JetBrains Mono
themeConfig:
  primary: '#4fc08d'
---

# Intro

Welcome to the browser flow test.

<div v-click>First reveal</div>

<div v-click>Second reveal</div>

<!--
Remember to pause on each reveal.
-->

---

# Final slide

Done.
`

const SMALL_CANVAS_DECK = `---
title: Small canvas preview test
canvasWidth: 40
---

# Compact slide

This slide should scale up to fill the preview pane.
`

const CORE_PARITY_DECK = `---
title: Core parity
---

# Click syntax

<div v-click>Step one</div>
<div v-after>Step one with after</div>
<ul v-clicks>
  <li>Item one</li>
  <li>Item two</li>
  <li>Item three</li>
</ul>

---
src: ./src/test-fixtures/import-range-slides.md#2-3
class: range-import
layout: end
---

---
layout: iframe-right
url: https://example.com/demo
---

# Embedded content

Iframe side content.

---
layout: none
---

\`\`\`ts [demo.ts] {lines:true,startLine:5}{2-3|4|all}
const one = 1
const two = 2
const three = 3
const four = 4
\`\`\`
`

afterEach(() => {
  document.body.innerHTML = ''
})

describe('App browser scenarios', () => {
  it('Given a shared hash When the app loads Then it renders the full deck in preview', async () => {
    using app = await AppPage.render({ markdown: TWO_SLIDE_DECK })

    app.expectSlideCount(2)
    app.expectSlideVisible('Intro')
    app.expectSlideVisible('Final slide')
    app.expectPreviewSlideAction(1)
    app.expectPreviewSlideAction(2)
  })

  it('Given the app is open When the markdown changes Then the preview updates through the real App.vue flow', async () => {
    using app = await AppPage.render({
      markdown: '# One slide\n\nInitial content',
    })

    app.expectSlideCount(1)

    await app.updateMarkdown(
      '# One slide\n\nInitial content\n\n---\n\n# Two slides now\n\nUpdated from the editor.',
    )

    app.expectSlideCount(2)
    app.expectSlideVisible('Two slides now')
  })

  it('Given a wide preview pane When the app renders slides Then each preview slide fills the available width', async () => {
    using app = await AppPage.render({ markdown: SMALL_CANVAS_DECK }, { previewWidth: 1600 })

    const { previewWidth, contentWidth } = app.measurePreviewWidths()

    expect(contentWidth).toBeGreaterThan(40)
    expect(Math.abs(previewWidth - contentWidth)).toBeLessThan(2)
  })

  it('Given style settings and frontmatter fonts When the user changes theme controls Then the app applies them globally', async () => {
    using app = await AppPage.render({ markdown: TWO_SLIDE_DECK })

    app.expectFontFamilyVar('sans', 'Poppins')
    app.expectFontFamilyVar('mono', 'JetBrains Mono')
    app.expectFontLinkLoaded()

    const styleSettings = await app.openStyleSettings()
    styleSettings.expectOpen()

    await styleSettings.setDarkMode()
    app.expectDarkMode()

    await styleSettings.setPrimaryColor('#ff0000')
    app.expectThemePrimary('#ff0000')

    await styleSettings.setCanvasWidth(1200)
    await styleSettings.setAspectRatio('4:3')

    expect(app.measureSlideCanvas()).toEqual({
      width: '1200px',
      height: '900px',
    })
  })

  it('Given frontmatter comments When the user edits style settings Then the app updates only the target YAML value', async () => {
    using app = await AppPage.render({
      markdown: `---
title: Browser flow test
themeConfig:
  primary: '#4fc08d' # keep this comment
---

# Intro
`,
    })

    const styleSettings = await app.openStyleSettings()
    styleSettings.expectOpen()
    await styleSettings.setPrimaryColor('#ff0000')

    app.expectThemePrimary('#ff0000')

    await app.share()

    const sharedMarkdown = app.getSharedMarkdown()
    expect(sharedMarkdown).toContain(`primary: '#ff0000' # keep this comment`)
    expect(sharedMarkdown).not.toContain(`primary: '#4fc08d' # keep this comment`)
  })

  it('Given style settings When the user changes canvas width and aspect ratio Then the shared deck keeps typed headmatter values', async () => {
    using app = await AppPage.render({ markdown: '# Intro' })

    const styleSettings = await app.openStyleSettings()
    styleSettings.expectOpen()

    await styleSettings.setCanvasWidth(1440)
    await styleSettings.setAspectRatio('1:1')

    await app.share()

    const sharedMarkdown = app.getSharedMarkdown()
    expect(sharedMarkdown).toContain('canvasWidth: 1440')
    expect(sharedMarkdown).toContain("aspectRatio: '1:1'")
  })

  it('Given a slide deck with click reveals When the user presents and navigates Then the app behaves like a real slideshow', async () => {
    using app = await AppPage.render({ markdown: TWO_SLIDE_DECK })

    const presentation = await app.present()
    presentation.expectOpen()
    presentation.expectSlidePosition('1 / 2')

    await presentation.next()
    presentation.expectSlidePosition('1 / 2')
    presentation.expectClickPosition('(1/2)')

    await presentation.next()
    presentation.expectSlidePosition('1 / 2')
    presentation.expectClickPosition('(2/2)')

    await presentation.pressKey('n')
    presentation.expectSpeakerNotesVisible()
    presentation.expectSpeakerNotesText('Remember to pause on each reveal.')

    await presentation.openOverview()
    presentation.expectOverviewOpen()
    await presentation.jumpToSlide(2)
    presentation.expectSlidePosition('2 / 2')
  })

  it('Given core Slidev markdown features When the app renders and presents Then click syntax, imports, layouts, and code metadata behave as expected', async () => {
    using app = await AppPage.render({ markdown: CORE_PARITY_DECK })

    app.expectSlideCount(5)
    app.expectSlideVisible('Imported middle')
    app.expectSlideVisible('Imported end')
    app.expectSlideVisible('Embedded content')
    app.expectIframeLayoutVisible('https://example.com/demo')
    app.expectCodeTitle('demo.ts')

    const presentation = await app.present()
    presentation.expectSlidePosition('1 / 5')
    presentation.expectTextHidden('Step one')
    presentation.expectTextHidden('Step one with after')
    presentation.expectTextHidden('Item one')

    await presentation.next()
    presentation.expectTextVisible('Step one')
    presentation.expectTextVisible('Step one with after')
    presentation.expectTextHidden('Item one')

    await presentation.next()
    presentation.expectTextVisible('Item one')
    presentation.expectTextHidden('Item two')

    await presentation.next()
    presentation.expectTextVisible('Item two')
    presentation.expectTextHidden('Item three')

    await presentation.next()
    presentation.expectTextVisible('Item three')

    await presentation.next()
    presentation.expectSlidePosition('2 / 5')
    presentation.expectSlideHeading('Imported middle')

    await presentation.next()
    presentation.expectSlidePosition('3 / 5')
    presentation.expectSlideHeading('Imported end')

    await presentation.next()
    presentation.expectSlidePosition('4 / 5')
    presentation.expectIframeLayoutVisible('https://example.com/demo')

    await presentation.next()
    presentation.expectSlidePosition('5 / 5')
    presentation.expectCodeLineNumber('5')
    presentation.expectCodeHighlightedLines(['6', '7'])

    await presentation.next()
    presentation.expectCodeHighlightedLines(['8'])

    await presentation.next()
    presentation.expectCodeHighlightedLines(['5', '6', '7', '8'])
  })

  it('Given native share is unavailable When the user shares Then the app falls back to copying the current URL', async () => {
    using app = await AppPage.render({ markdown: TWO_SLIDE_DECK })

    await app.share()

    expect(app.shareSpy).not.toHaveBeenCalled()
    app.expectHashPresent()
  })

  it('Given native share is available When the user shares Then the app uses the browser share API', async () => {
    using app = await AppPage.render({ markdown: TWO_SLIDE_DECK, nativeShare: true })

    await app.share()

    expect(app.shareSpy).toHaveBeenCalledTimes(1)
    expect(app.clipboardSpy).not.toHaveBeenCalled()
    expect(app.shareSpy.mock.calls[0]?.[0]).toMatchObject({
      title: 'Slidev Playground',
      url: window.location.href,
    })
  })
})
