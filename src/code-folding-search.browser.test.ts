import { foldAll } from '@codemirror/language'
import { openSearchPanel } from '@codemirror/search'
import { AppPage } from './test-utils/page-objects/app-page'
import { getEditorView, settleApp } from './test-utils/app-browser'
import { TWO_SLIDE_DECK } from './test-utils/browser-test-fixtures'

it('Given the editor When mounted Then a fold gutter renders next to the line numbers', async () => {
  using app = await AppPage.render({ markdown: TWO_SLIDE_DECK })

  const gutter = app.container.querySelector('.cm-foldGutter')
  expect(gutter instanceof HTMLElement).toBe(true)
})

it('Given a multi-slide deck When foldAll is dispatched Then the rendered line count drops', async () => {
  using app = await AppPage.render({ markdown: TWO_SLIDE_DECK })

  const view = getEditorView(app.screen)
  const beforeLines = view.dom.querySelectorAll('.cm-line').length

  foldAll(view)
  await settleApp()

  const afterLines = view.dom.querySelectorAll('.cm-line').length
  expect(afterLines).toBeLessThan(beforeLines)
})

it('Given the editor When openSearchPanel runs Then the search panel renders', async () => {
  using app = await AppPage.render({ markdown: TWO_SLIDE_DECK })

  const view = getEditorView(app.screen)
  openSearchPanel(view)
  await settleApp()

  const searchPanel = app.container.querySelector('.cm-panel.cm-search')
  expect(searchPanel instanceof HTMLElement).toBe(true)
})
