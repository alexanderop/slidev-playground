import { AppPage } from './test-utils/page-objects/app-page'
import { deck } from './test-utils/deck-builder'

it('Given the preview slide actions When the user opens slide 2 and exits presentation Then the targeted slide opens and the editor remains available', async () => {
  const markdown = deck()
    .title('Preview launch')
    .slide('First slide', (s) => s.text('Start here'))
    .slide('Second slide', (s) => s.text('Opened from preview'))
    .build()

  using app = await AppPage.render({ markdown })

  await app.screen.getByRole('button', { name: 'Open slide 2 in presentation' }).click()

  app.presentation.expectOpen()
  app.presentation.expectSlidePosition('2 / 2')
  app.presentation.expectSlideHeading('Second slide')

  await app.screen.getByRole('button', { name: 'Exit' }).click()

  expect(app.container.querySelector('[aria-label="Presentation mode"]')).toBeNull()
  app.expectSlideVisible('First slide')
  app.expectSlideVisible('Second slide')
})

it('Given the editor When the user opens goto before presenting Then arrow navigation and Enter start presentation on the selected slide', async () => {
  const markdown = deck()
    .title('Goto flow')
    .slide('Slide 1', (s) => s.text('One'))
    .slide('Slide 2', (s) => s.text('Two'))
    .slide('Slide 3', (s) => s.text('Three'))
    .build()

  using app = await AppPage.render({ markdown })

  await app.pressShortcut('g')
  app.presentation.expectGotoOpen()

  await app.presentation.searchGoto('9')
  expect(app.screen.getByText('No matching slides.')).toBeTruthy()

  await app.pressShortcut('Escape')
  expect(app.container.querySelector('[aria-label="Goto slide"]')).toBeNull()

  await app.pressShortcut('g')
  await app.presentation.searchGoto('')
  await app.presentation.pressShortcut('ArrowDown')
  await app.presentation.pressShortcut('ArrowDown')
  await app.presentation.pressShortcut('Enter')

  app.presentation.expectOpen()
  app.presentation.expectSlidePosition('3 / 3')
  app.presentation.expectSlideHeading('Slide 3')
})

it('Given the editor When the user opens slide overview before presenting Then selecting a slide starts presentation from that slide', async () => {
  const markdown = deck()
    .title('Overview flow')
    .slide('Cover', (s) => s.text('Overview opens presentation'))
    .slide('Middle', (s) => s.text('Middle slide'))
    .slide('Finish', (s) => s.text('Picked from overview'))
    .build()

  using app = await AppPage.render({ markdown })

  await app.pressShortcut('o')

  app.presentation.expectOverviewOpen()
  await app.presentation.jumpToSlide(3)

  app.presentation.expectOpen()
  app.presentation.expectSlidePosition('3 / 3')
  app.presentation.expectSlideHeading('Finish')
  expect(app.container.querySelector('[aria-label="Slide overview"]')).toBeNull()
})

it('Given presentation controls at the deck boundaries When the user navigates to the end Then prev and next buttons reflect the available actions', async () => {
  const markdown = deck()
    .title('Boundary controls')
    .slide('Opening', (s) => s.text('First'))
    .slide('Ending', (s) => s.text('Last'))
    .build()

  using app = await AppPage.render({ markdown })

  await app.screen.getByRole('button', { name: 'Open slide 1 in presentation' }).click()
  app.presentation.expectOpen()

  const prevButton = app.screen.getByRole('button', { name: 'Prev' })
  const nextButton = app.screen.getByRole('button', { name: 'Next' })
  const prevElement = prevButton.element()
  const nextElement = nextButton.element()

  expect(prevElement instanceof HTMLButtonElement).toBe(true)
  expect(nextElement instanceof HTMLButtonElement).toBe(true)
  if (!(prevElement instanceof HTMLButtonElement) || !(nextElement instanceof HTMLButtonElement)) {
    throw new Error('Expected presentation controls to render button elements')
  }

  expect(prevElement.disabled).toBe(true)
  expect(nextElement.disabled).toBe(false)

  await nextButton.click()

  app.presentation.expectSlidePosition('2 / 2')
  expect(prevElement.disabled).toBe(false)
  expect(nextElement.disabled).toBe(true)
})
