import { AppPage } from './test-utils/page-objects/app-page'
import { deck } from './test-utils/deck-builder'

function minimalDeck() {
  return deck().title('Original title').slide('Intro').build()
}

it('Given the style panel When the user edits the title Then the shared markdown keeps the new title', async () => {
  using app = await AppPage.render({ markdown: minimalDeck() })

  const styleSettings = await app.openStyleSettings()
  styleSettings.expectOpen()

  const titleInput = app.screen.getByRole('textbox', { name: 'Title' })
  await titleInput.fill('Updated deck title')

  await app.share()
  const sharedMarkdown = app.getSharedMarkdown()
  expect(sharedMarkdown).toContain('title: Updated deck title')
  expect(sharedMarkdown).not.toContain('title: Original title')
})

it('Given the style panel When the user closes it via the close button Then the panel is removed from the DOM', async () => {
  using app = await AppPage.render({ markdown: minimalDeck() })

  const styleSettings = await app.openStyleSettings()
  styleSettings.expectOpen()

  await app.screen.getByRole('button', { name: 'Close style settings' }).click()

  expect(app.container.querySelector('[aria-label="Style settings"]')).toBeNull()
})
