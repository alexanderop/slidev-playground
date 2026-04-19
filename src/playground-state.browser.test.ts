import { settleApp } from './test-utils/app-browser'
import { deck } from './test-utils/deck-builder'
import { AppPage } from './test-utils/page-objects/app-page'

async function waitForHashChange(initialHash: string, timeoutMs = 2500) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs && window.location.hash === initialHash) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 50)
    })
  }
  if (window.location.hash === initialHash) {
    throw new Error('Timed out waiting for url hash to update after edit')
  }
  await settleApp()
}

it('Given valid and broken components When serialized and reloaded Then state round-trips, DOM renders, broken components surface as structured errors, and the hash is idempotent', async () => {
  const md = deck()
    .title('Round trip')
    .slide('Valid', (s) => s.text('<Quote author="A">hi</Quote>'))
    .slide('Broken', (s) => s.text('<Broken />'))
    .build()

  using app = await AppPage.render({
    markdown: md,
    componentFiles: {
      'Quote.vue':
        '<script setup>\ndefineProps(["author"])\n</script>\n<template><q>—{{ author }}<slot /></q></template>',
      'Broken.vue': '<script setup>\ndefineProps(["x"])\n</script>\n',
    },
  })

  // (a) Valid component renders
  const blockquote = app.container.querySelector('q')
  expect(blockquote).toBeTruthy()
  expect(blockquote?.textContent).toContain('hi')
  expect(blockquote?.textContent).toContain('A')

  // (b) Broken component surfaces as a visible error block
  const errorBlock = app.container.querySelector('.slidev-error-block')
  expect(errorBlock).toBeTruthy()
  expect(errorBlock?.textContent).toContain('Broken')

  // (c) Style tag is owned exactly once
  expect(document.querySelectorAll('#slidev-custom-component-styles')).toHaveLength(1)

  // (d) Hash round-trips: what we rendered from is what we'd share
  app.expectHashPresent()
  const initialHash = window.location.hash
  const first = app.getSharedState()
  expect(first.markdown).toBe(md)
  expect(first.componentFiles['Quote.vue']).toBeTruthy()
  expect(first.componentFiles['Broken.vue']).toBeTruthy()

  // (e) Debounced edit re-encodes; second share preserves component files
  const updated = `${md}\n---\n\n# Added\n`
  await app.updateMarkdown(updated)
  await waitForHashChange(initialHash)
  const second = app.getSharedState()
  expect(second.markdown).toContain('# Added')
  expect(second.componentFiles).toEqual(first.componentFiles)
})
