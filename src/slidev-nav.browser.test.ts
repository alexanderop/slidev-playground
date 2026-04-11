import { settleApp } from './test-utils/app-browser'
import { AppPage } from './test-utils/page-objects/app-page'
import { NAV_CLICK_DECK } from './test-utils/browser-test-fixtures'

it('Given a slide with $slidev.nav.next When the app renders Then no Vue warnings about $ prefix are emitted', async () => {
  const warnSpy = vi.spyOn(console, 'warn')

  using app = await AppPage.render({ markdown: NAV_CLICK_DECK })

  app.expectSlideVisible('Cover')

  const dollarWarnings = warnSpy.mock.calls.filter(
    (args) => typeof args[0] === 'string' && args[0].includes('$slidev'),
  )
  expect(dollarWarnings).toHaveLength(0)

  warnSpy.mockRestore()
})

it('Given a slide with @click="$slidev.nav.next" When presenting and clicking the trigger Then it advances to the next slide', async () => {
  using app = await AppPage.render({ markdown: NAV_CLICK_DECK })

  const presentation = await app.present()
  presentation.expectSlidePosition('1 / 2')

  const trigger = app.container.querySelector('.nav-trigger')
  if (!(trigger instanceof HTMLElement)) {
    throw new Error('Expected nav trigger')
  }
  trigger.click()

  await settleApp()
  await settleApp()

  presentation.expectSlidePosition('2 / 2')
})
