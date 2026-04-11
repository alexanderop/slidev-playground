import { AppPage } from './test-utils/page-objects/app-page'
import { TWO_SLIDE_DECK } from './test-utils/browser-test-fixtures'

it('Given presentation mode When runtime shortcuts are used Then dark mode and fullscreen behave like the real player', async () => {
  using app = await AppPage.render({ markdown: TWO_SLIDE_DECK })

  const presentation = await app.present()

  await presentation.pressKey('d')
  app.expectDarkMode()

  await presentation.pressKey('f')
  expect(app.requestFullscreenSpy).toHaveBeenCalledTimes(1)

  await presentation.pressKey('f')
  expect(app.exitFullscreenSpy).toHaveBeenCalledTimes(1)
})

it('Given fullscreen is unavailable When the user presses f Then the app shows the unsupported alert', async () => {
  using app = await AppPage.render({ markdown: TWO_SLIDE_DECK })
  Reflect.deleteProperty(Element.prototype, 'requestFullscreen')

  const presentation = await app.present()
  await presentation.pressKey('f')

  expect(app.alertSpy).toHaveBeenCalledWith('upsi')
})

it('Given the app is not presenting When the user presses f Then fullscreen is ignored', async () => {
  using app = await AppPage.render({ markdown: TWO_SLIDE_DECK })

  await app.pressShortcut('f')

  expect(app.requestFullscreenSpy).not.toHaveBeenCalled()
  expect(app.alertSpy).not.toHaveBeenCalled()
})

it('Given a deck with explicit dark colorSchema When the user presses d Then runtime dark mode still toggles', async () => {
  using app = await AppPage.render({
    markdown: '---\ncolorSchema: dark\n---\n\n# Dark slide',
  })

  app.expectDarkMode()

  await app.pressShortcut('d')
  app.expectDarkMode(false)

  await app.pressShortcut('d')
  app.expectDarkMode()
})

it('Given the editor When p is pressed Then presentation mode starts', async () => {
  using app = await AppPage.render({ markdown: TWO_SLIDE_DECK })

  await app.pressShortcut('p')

  app.presentation.expectOpen()
})

it('Given presentation mode When p is pressed Then presentation mode stops', async () => {
  using app = await AppPage.render({ markdown: TWO_SLIDE_DECK })

  const presentation = await app.present()

  await presentation.pressKey('p')

  expect(app.container.querySelector('[aria-label="Presentation mode"]')).toBeNull()
})

it('Given the editor is focused When shortcut keys are pressed Then the editor keeps control', async () => {
  using app = await AppPage.render({ markdown: TWO_SLIDE_DECK })

  const editor = app.container.querySelector('.cm-editor')
  if (!(editor instanceof HTMLElement)) {
    throw new Error('Expected editor to exist')
  }

  const editorContent = editor.querySelector('.cm-content')
  if (!(editorContent instanceof HTMLElement)) {
    throw new Error('Expected editor content to exist')
  }

  editorContent.focus()
  await app.pressShortcut('d')

  expect(document.documentElement.classList.contains('dark')).toBe(false)
})
