import { AppPage } from './test-utils/page-objects/app-page'
import { TWO_SLIDE_DECK } from './test-utils/browser-test-fixtures'
import { deck } from './test-utils/deck-builder'

it('Given an added component file When the user removes it Then the tab disappears and the editor returns to slides.md', async () => {
  using app = await AppPage.render({ markdown: TWO_SLIDE_DECK })

  await app.addComponentFile()
  expect(app.screen.getByRole('button', { name: /Comp1\.vue/ })).toBeTruthy()

  await app.screen.getByRole('button', { name: 'Remove Comp1.vue', exact: true }).click()

  expect(app.container.querySelector('[aria-label="Remove Comp1.vue"]')).toBeNull()
  expect(app.screen.getByRole('button', { name: 'slides.md' })).toBeTruthy()
})

it('Given two component files When the user removes a non-active tab Then the active tab stays', async () => {
  using app = await AppPage.render({ markdown: TWO_SLIDE_DECK })

  await app.addComponentFile()
  await app.addComponentFile()
  await app.screen.getByRole('button', { name: /^Comp1\.vue/ }).click()

  await app.screen.getByRole('button', { name: 'Remove Comp2.vue', exact: true }).click()

  expect(app.container.querySelector('[aria-label="Remove Comp2.vue"]')).toBeNull()
  expect(app.screen.getByRole('button', { name: /^Comp1\.vue/ })).toBeTruthy()
})

it('Given the split pane When the user drags the divider Then the editor pane width updates', async () => {
  using app = await AppPage.render({ markdown: TWO_SLIDE_DECK })

  const divider = app.container.querySelector('.divider')
  if (!(divider instanceof HTMLElement)) {
    throw new Error('Expected divider element to exist')
  }
  const editorPane = app.container.querySelector('.editor-pane')
  if (!(editorPane instanceof HTMLElement)) {
    throw new Error('Expected editor pane to exist')
  }

  const startWidth = editorPane.style.width
  divider.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }))
  window.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 200 }))
  window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
  await new Promise((resolve) => setTimeout(resolve, 50))

  expect(editorPane.style.width).not.toBe(startWidth)
})

it('Given presentation mode When the user clicks the right click-zone Then the deck advances', async () => {
  using app = await AppPage.render({ markdown: TWO_SLIDE_DECK })

  const presentation = await app.present()
  presentation.expectSlidePosition('1 / 2')

  const rightZone = app.container.querySelector('.click-zone-right')
  if (!(rightZone instanceof HTMLElement)) {
    throw new Error('Expected right click zone to exist')
  }
  rightZone.click()
  rightZone.click()
  rightZone.click()

  presentation.expectSlidePosition('2 / 2')
})

it('Given presentation mode When the user uses plain ArrowRight and ArrowLeft Then clicks advance and retreat', async () => {
  const md = deck()
    .title('Plain arrow deck')
    .slide('Intro', (s) => s.click('Reveal one').click('Reveal two'))
    .slide('End', (s) => s.text('Done'))
    .build()

  using app = await AppPage.render({ markdown: md })

  const presentation = await app.present()
  presentation.expectClickPosition('(0/2)')

  await presentation.pressShortcut('ArrowRight')
  presentation.expectClickPosition('(1/2)')

  await presentation.pressShortcut('ArrowRight')
  presentation.expectClickPosition('(2/2)')

  await presentation.pressShortcut('ArrowLeft')
  presentation.expectClickPosition('(1/2)')
})
