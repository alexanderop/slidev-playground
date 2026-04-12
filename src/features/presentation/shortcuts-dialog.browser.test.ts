import { AppPage } from '../../test-utils/page-objects/app-page'
import { deck } from '../../test-utils/deck-builder'
import { SHORTCUTS_CATALOG } from './shortcuts-catalog'

const BASIC_DECK = deck()
  .title('Shortcuts dialog test')
  .slide('First slide', (s) => s.text('One'))
  .slide('Second slide', (s) => s.text('Two'))
  .build()

it('Given a deck When the user presses ? Then the shortcuts dialog opens', async () => {
  using app = await AppPage.render({ markdown: BASIC_DECK })

  await app.pressShortcut('?', { shiftKey: true })

  expect(app.screen.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeTruthy()
})

it('Given the shortcuts dialog is open Then every shortcut from the catalog is listed', async () => {
  using app = await AppPage.render({ markdown: BASIC_DECK })

  await app.pressShortcut('?', { shiftKey: true })

  for (const entry of SHORTCUTS_CATALOG) {
    expect(app.screen.getByText(entry.description)).toBeTruthy()
  }
})

it('Given the shortcuts dialog is open When the user presses Escape Then it closes', async () => {
  using app = await AppPage.render({ markdown: BASIC_DECK })

  await app.pressShortcut('?', { shiftKey: true })
  expect(app.screen.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeTruthy()

  await app.pressShortcut('Escape')

  expect(app.container.querySelector('[aria-label="Keyboard shortcuts"]')).toBeNull()
})

it('Given the shortcuts dialog is open When the user presses ? again Then it closes', async () => {
  using app = await AppPage.render({ markdown: BASIC_DECK })

  await app.pressShortcut('?', { shiftKey: true })
  expect(app.screen.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeTruthy()

  await app.pressShortcut('?', { shiftKey: true })

  expect(app.container.querySelector('[aria-label="Keyboard shortcuts"]')).toBeNull()
})

it('Given the shortcuts dialog is open When the user presses ArrowRight Then the slide does not advance', async () => {
  using app = await AppPage.render({ markdown: BASIC_DECK })

  const presentation = await app.present()
  presentation.expectSlidePosition('1 / 2')

  await app.pressShortcut('?', { shiftKey: true })
  expect(app.screen.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeTruthy()

  await app.pressShortcut('ArrowRight')

  presentation.expectSlidePosition('1 / 2')
})

it('Given focus is in the editor When the user types ? Then the dialog does not open', async () => {
  using app = await AppPage.render({ markdown: BASIC_DECK })

  const editor = app.container.querySelector('.cm-content')
  if (!(editor instanceof HTMLElement)) {
    throw new Error('Expected CodeMirror content element to exist')
  }
  editor.focus()

  await app.pressShortcut('?', { shiftKey: true })

  expect(app.container.querySelector('[aria-label="Keyboard shortcuts"]')).toBeNull()
})

it('Given presenting When the user presses ? Then the dialog opens over the presentation', async () => {
  using app = await AppPage.render({ markdown: BASIC_DECK })

  const presentation = await app.present()
  presentation.expectOpen()

  await app.pressShortcut('?', { shiftKey: true })

  expect(app.screen.getByRole('dialog', { name: 'Presentation mode' })).toBeTruthy()
  expect(app.screen.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeTruthy()
})
