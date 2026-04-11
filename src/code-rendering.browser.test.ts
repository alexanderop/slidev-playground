import { AppPage } from './test-utils/page-objects/app-page'
import { CODE_STYLING_DECK, CORE_PARITY_DECK } from './test-utils/browser-test-fixtures'

it('Given code blocks with highlights When the app renders Then highlighted lines are marked and non-highlighted lines are dishonored', async () => {
  using app = await AppPage.render({ markdown: CODE_STYLING_DECK })
  await app.waitForCodeBlocks()

  const block = app.codeBlock(0)
  block.expectLineCount(4)
  block.expectHighlightedCount(2)
  block.expectDishonoredCount(2)
})

it('Given code blocks without highlights When the app renders Then no lines are dishonored', async () => {
  using app = await AppPage.render({ markdown: CODE_STYLING_DECK })
  await app.waitForCodeBlocks()

  const block = app.codeBlock(1)
  block.expectNoDishonored()
  block.expectNoHighlights()
})

it('Given code blocks When the app renders Then Shiki emits dual-theme CSS variables for light and dark mode', async () => {
  using app = await AppPage.render({ markdown: CODE_STYLING_DECK })
  await app.waitForCodeBlocks()

  app.expectShikiDualThemeVars()
})

it('Given code blocks When the app renders Then inline background-color is removed from pre elements', async () => {
  using app = await AppPage.render({ markdown: CODE_STYLING_DECK })
  await app.waitForCodeBlocks()

  app.expectCodeBlockBackground()
})

it('Given a code block with a filename When the app renders Then the title is displayed', async () => {
  using app = await AppPage.render({ markdown: CODE_STYLING_DECK })
  await app.waitForCodeBlocks()

  app.expectCodeTitle('utils.ts')
})

it('Given code blocks with step highlights When presenting Then dishonored lines update with each click step', async () => {
  using app = await AppPage.render({ markdown: CORE_PARITY_DECK })

  const presentation = await app.present()

  await presentation.pressKey('g')
  presentation.expectGotoOpen()
  await presentation.searchGoto('5')
  await presentation.pressKey('Enter')
  presentation.expectSlidePosition('5 / 5')
  await app.waitForCodeBlocks()

  app.expectCodeHighlightedLines(['6', '7'])
  app.expectCodeDishonoredLines(['5', '8'])

  await presentation.next()
  app.expectCodeHighlightedLines(['8'])
  app.expectCodeDishonoredLines(['5', '6', '7'])

  await presentation.next()
  app.expectCodeHighlightedLines(['5', '6', '7', '8'])
})
