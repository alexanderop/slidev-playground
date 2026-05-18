import { AppPage } from './test-utils/page-objects/app-page'
import { settleApp } from './test-utils/app-browser'
import { TWO_SLIDE_DECK } from './test-utils/browser-test-fixtures'

function requireToggler(app: AppPage): HTMLButtonElement {
  const toggler = app.container.querySelector('.mobile-toggler')
  if (!(toggler instanceof HTMLButtonElement)) {
    throw new Error('Expected .mobile-toggler button to exist')
  }
  return toggler
}

it('Given the playground When mounted Then a mobile toggler button exists', async () => {
  using app = await AppPage.render({ markdown: TWO_SLIDE_DECK })

  const toggler = app.container.querySelector('.mobile-toggler')
  expect(toggler instanceof HTMLButtonElement).toBe(true)
})

it('Given the default mobile state When the user clicks the toggler Then the split-pane gains the show-output class', async () => {
  using app = await AppPage.render({ markdown: TWO_SLIDE_DECK })

  const splitPane = app.container.querySelector('.split-pane')
  if (!(splitPane instanceof HTMLElement)) {
    throw new Error('Expected split-pane to exist')
  }
  expect(splitPane.classList.contains('show-output')).toBe(false)

  const toggler = requireToggler(app)
  toggler.click()
  await settleApp()

  expect(splitPane.classList.contains('show-output')).toBe(true)

  toggler.click()
  await settleApp()
  expect(splitPane.classList.contains('show-output')).toBe(false)
})

it('Given the toggler When toggling Then its label reflects the next-action target', async () => {
  using app = await AppPage.render({ markdown: TWO_SLIDE_DECK })

  const toggler = requireToggler(app)
  const initialLabel = toggler.textContent?.trim() ?? ''
  expect(initialLabel).toMatch(/preview/i)

  toggler.click()
  await settleApp()

  const nextLabel = toggler.textContent?.trim() ?? ''
  expect(nextLabel).toMatch(/code/i)
  expect(nextLabel).not.toBe(initialLabel)
})
