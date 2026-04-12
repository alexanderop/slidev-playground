import { AppPage } from './test-utils/page-objects/app-page'
import { deck } from './test-utils/deck-builder'

const GOTO_DECK = deck()
  .title('Goto dialog test')
  .slide('Slide 1', (s) => s.text('One'))
  .slide('Slide 2', (s) => s.text('Two'))
  .slide('Slide 3', (s) => s.text('Three'))
  .slide('Slide 4', (s) => s.text('Four'))
  .build()

it('Given the goto dialog When the user presses ArrowUp from the first result Then selection wraps to the last match', async () => {
  using app = await AppPage.render({ markdown: GOTO_DECK })

  await app.pressShortcut('g')
  app.presentation.expectGotoOpen()

  await app.presentation.pressShortcut('ArrowUp')
  await app.presentation.pressShortcut('Enter')

  app.presentation.expectOpen()
  app.presentation.expectSlidePosition('4 / 4')
  app.presentation.expectSlideHeading('Slide 4')
})

it('Given the goto dialog with no matches When the user presses Enter Then the dialog closes without navigating', async () => {
  using app = await AppPage.render({ markdown: GOTO_DECK })

  await app.pressShortcut('g')
  app.presentation.expectGotoOpen()
  await app.presentation.searchGoto('99')
  expect(app.screen.getByText('No matching slides.')).toBeTruthy()

  await app.presentation.pressShortcut('Enter')

  expect(app.container.querySelector('[aria-label="Goto slide"]')).toBeNull()
  app.presentation.expectSlidePosition('1 / 4')
})

it('Given the goto dialog When the user clicks a result button Then the app starts presenting that slide', async () => {
  using app = await AppPage.render({ markdown: GOTO_DECK })

  await app.pressShortcut('g')
  app.presentation.expectGotoOpen()

  await app.screen.getByRole('button', { name: 'Go to slide 2' }).click()

  app.presentation.expectOpen()
  app.presentation.expectSlidePosition('2 / 4')
  app.presentation.expectSlideHeading('Slide 2')
})

it('Given a narrowed query When the user clears it Then selection clamps to the first match', async () => {
  using app = await AppPage.render({ markdown: GOTO_DECK })

  await app.pressShortcut('g')
  await app.presentation.searchGoto('4')
  await app.presentation.searchGoto('')
  await app.presentation.pressShortcut('Enter')

  app.presentation.expectOpen()
  app.presentation.expectSlidePosition('1 / 4')
})
