import { AppPage } from './test-utils/page-objects/app-page'
import { SMALL_CANVAS_DECK } from './test-utils/browser-test-fixtures'

it('Given the app is open When the markdown changes Then the preview updates through the real App.vue flow', async () => {
  using app = await AppPage.render({
    markdown: '# One slide\n\nInitial content',
  })

  app.expectSlideCount(1)

  await app.updateMarkdown(
    '# One slide\n\nInitial content\n\n---\n\n# Two slides now\n\nUpdated from the editor.',
  )

  app.expectSlideCount(2)
  app.expectSlideVisible('Two slides now')
})

it('Given a wide preview pane When the app renders slides Then each preview slide fills the available width', async () => {
  using app = await AppPage.render({ markdown: SMALL_CANVAS_DECK }, { previewWidth: 1600 })

  const { previewWidth, contentWidth } = app.measurePreviewWidths()

  expect(contentWidth).toBeGreaterThan(40)
  expect(Math.abs(previewWidth - contentWidth)).toBeLessThan(2)
})
