import { AppPage } from './test-utils/page-objects/app-page'
import { TWO_SLIDE_DECK } from './test-utils/browser-test-fixtures'

it('Given style settings and frontmatter fonts When the user changes theme controls Then the app applies them globally', async () => {
  using app = await AppPage.render({ markdown: TWO_SLIDE_DECK })

  app.expectFontFamilyVar('sans', 'Poppins')
  app.expectFontFamilyVar('mono', 'JetBrains Mono')
  app.expectFontLinkLoaded()

  const styleSettings = await app.openStyleSettings()
  styleSettings.expectOpen()

  await styleSettings.setDarkMode()
  app.expectDarkMode()

  await styleSettings.setPrimaryColor('#ff0000')
  app.expectThemePrimary('#ff0000')

  await styleSettings.setCanvasWidth(1200)
  await styleSettings.setAspectRatio('4:3')

  expect(app.measureSlideCanvas()).toEqual({
    width: '1200px',
    height: '900px',
  })
})

it('Given frontmatter comments When the user edits style settings Then the app updates only the target YAML value', async () => {
  using app = await AppPage.render({
    markdown: `---
title: Browser flow test
themeConfig:
  primary: '#4fc08d' # keep this comment
---

# Intro
`,
  })

  const styleSettings = await app.openStyleSettings()
  styleSettings.expectOpen()
  await styleSettings.setPrimaryColor('#ff0000')

  app.expectThemePrimary('#ff0000')

  await app.share()

  const sharedMarkdown = app.getSharedMarkdown()
  expect(sharedMarkdown).toContain(`primary: '#ff0000' # keep this comment`)
  expect(sharedMarkdown).not.toContain(`primary: '#4fc08d' # keep this comment`)
})

it('Given style settings When the user changes canvas width and aspect ratio Then the shared deck keeps typed headmatter values', async () => {
  using app = await AppPage.render({ markdown: '# Intro' })

  const styleSettings = await app.openStyleSettings()
  styleSettings.expectOpen()

  await styleSettings.setCanvasWidth(1440)
  await styleSettings.setAspectRatio('1:1')

  await app.share()

  const sharedMarkdown = app.getSharedMarkdown()
  expect(sharedMarkdown).toContain('canvasWidth: 1440')
  expect(sharedMarkdown).toContain("aspectRatio: '1:1'")
})
