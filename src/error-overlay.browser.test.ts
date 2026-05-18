import { AppPage } from './test-utils/page-objects/app-page'
import { settleApp, setMarkdown } from './test-utils/app-browser'
import { TWO_SLIDE_DECK } from './test-utils/browser-test-fixtures'

const COMPONENT_FILE_NO_TEMPLATE = `<script setup>
const x = 1
</script>
`

const COMPONENT_FILE_VALID = `<script setup>
const x = 1
</script>

<template>
  <div>ok</div>
</template>
`

it('Given a component compile error When the deck loads Then the editor shows an error overlay', async () => {
  using app = await AppPage.render({
    markdown: TWO_SLIDE_DECK,
    componentFiles: { 'Comp1.vue': COMPONENT_FILE_NO_TEMPLATE },
  })

  const overlay = app.container.querySelector('.editor-error-overlay')
  expect(overlay instanceof HTMLElement).toBe(true)
  expect(overlay?.textContent ?? '').toContain('No <template> block')
})

it('Given an error overlay is visible When the user dismisses it Then it disappears', async () => {
  using app = await AppPage.render({
    markdown: TWO_SLIDE_DECK,
    componentFiles: { 'Comp1.vue': COMPONENT_FILE_NO_TEMPLATE },
  })

  await app.screen.getByRole('button', { name: 'Dismiss error' }).click()
  await settleApp()

  expect(app.container.querySelector('.editor-error-overlay')).toBeNull()
})

it('Given a dismissed overlay When a new error arrives Then the overlay re-appears', async () => {
  using app = await AppPage.render({
    markdown: TWO_SLIDE_DECK,
    componentFiles: { 'Comp1.vue': COMPONENT_FILE_NO_TEMPLATE },
  })

  await app.screen.getByRole('button', { name: 'Dismiss error' }).click()
  await settleApp()
  expect(app.container.querySelector('.editor-error-overlay')).toBeNull()

  await app.screen.getByRole('button', { name: /^Comp1\.vue/ }).click()
  await settleApp()
  await setMarkdown(
    app.screen,
    '<script setup>\ndefineProps(brokenCall)\n</script>\n<template><div/></template>\n',
  )

  const overlay = app.container.querySelector('.editor-error-overlay')
  expect(overlay instanceof HTMLElement).toBe(true)
})

it('Given valid component files When the deck loads Then no error overlay is shown', async () => {
  using app = await AppPage.render({
    markdown: TWO_SLIDE_DECK,
    componentFiles: { 'Comp1.vue': COMPONENT_FILE_VALID },
  })

  expect(app.container.querySelector('.editor-error-overlay')).toBeNull()
})
