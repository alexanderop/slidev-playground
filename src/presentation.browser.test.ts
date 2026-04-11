import { AppPage } from './test-utils/page-objects/app-page'
import { CORE_PARITY_DECK, TWO_SLIDE_DECK } from './test-utils/browser-test-fixtures'

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

it('Given presentation mode When the slide is displayed Then it is centered in the viewport', async () => {
  using app = await AppPage.render({ markdown: TWO_SLIDE_DECK })
  const presentation = await app.present()
  presentation.expectOpen()
  presentation.expectSlideCentered()
})

it('Given presentation mode When Slidev shortcuts are used Then slide and click navigation match Slidev semantics', async () => {
  using app = await AppPage.render({ markdown: TWO_SLIDE_DECK })

  const presentation = await app.present()
  presentation.expectSlidePosition('1 / 2')

  await presentation.pressShortcut('ArrowDown')
  presentation.expectSlidePosition('2 / 2')

  await presentation.pressShortcut('ArrowUp')
  presentation.expectSlidePosition('1 / 2')
  presentation.expectClickPosition('(0/2)')

  await presentation.pressShortcut(' ', { shiftKey: true })
  presentation.expectSlidePosition('1 / 2')

  await presentation.pressShortcut('ArrowRight', { shiftKey: true })
  presentation.expectSlidePosition('2 / 2')

  await presentation.pressShortcut('ArrowLeft', { shiftKey: true })
  presentation.expectSlidePosition('1 / 2')
  presentation.expectClickPosition('(0/2)')

  await presentation.pressShortcut('PageDown')
  presentation.expectClickPosition('(1/2)')

  await presentation.pressShortcut('PageUp')
  presentation.expectClickPosition('(0/2)')
})

it('Given presentation mode When goto is opened from the keyboard Then the user can jump to a matching slide', async () => {
  using app = await AppPage.render({ markdown: CORE_PARITY_DECK })

  const presentation = await app.present()
  presentation.expectSlidePosition('1 / 5')

  await presentation.pressKey('g')
  presentation.expectGotoOpen()
  await presentation.searchGoto('4')
  await presentation.pressKey('Enter')

  presentation.expectSlidePosition('4 / 5')
  presentation.expectIframeLayoutVisible('https://example.com/demo')
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
