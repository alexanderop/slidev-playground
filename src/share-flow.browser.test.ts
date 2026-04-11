import { AppPage } from './test-utils/page-objects/app-page'
import { TWO_SLIDE_DECK } from './test-utils/browser-test-fixtures'

it('Given native share is unavailable When the user shares Then the app falls back to copying the current URL', async () => {
  using app = await AppPage.render({ markdown: TWO_SLIDE_DECK })

  await app.share()

  expect(app.shareSpy).not.toHaveBeenCalled()
  app.expectHashPresent()
})

it('Given native share is available When the user shares Then the app uses the browser share API', async () => {
  using app = await AppPage.render({ markdown: TWO_SLIDE_DECK, nativeShare: true })

  await app.share()

  expect(app.shareSpy).toHaveBeenCalledTimes(1)
  expect(app.clipboardSpy).not.toHaveBeenCalled()
  expect(app.shareSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      title: 'Slidev Playground',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      url: expect.any(String),
    }),
  )
})
