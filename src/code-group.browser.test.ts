import { settleApp } from './test-utils/app-browser'
import { deck } from './test-utils/deck-builder'
import { AppPage } from './test-utils/page-objects/app-page'

async function waitForActiveBlock(container: Element, timeoutMs = 2000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const activeBlock = container.querySelector(
      '.slidev-code-group-blocks .slidev-code-block.active',
    )
    if (activeBlock) {
      return activeBlock
    }
    // eslint-disable-next-line no-await-in-loop
    await settleApp()
  }
  throw new Error('Timed out waiting for active code block in CodeGroup')
}

it('should render CodeGroup with tabs and switch between code blocks', async () => {
  const md = deck()
    .slide('CodeGroup', (s) =>
      s.text(
        '<CodeGroup>\n\n```ts [app.ts]\nconsole.log("hello")\n```\n\n```py [app.py]\nprint("hello")\n```\n\n</CodeGroup>',
      ),
    )
    .build()

  using app = await AppPage.render({ markdown: md })
  await waitForActiveBlock(app.container)

  const tabs = app.container.querySelectorAll('.slidev-code-tab')
  expect(tabs.length).toBe(2)
  expect(tabs[0].textContent?.trim()).toBe('app.ts')
  expect(tabs[1].textContent?.trim()).toBe('app.py')

  // Verify first tab is active, second is not
  const activeBlocks = app.container.querySelectorAll(
    '.slidev-code-group-blocks .slidev-code-block.active',
  )
  expect(activeBlocks.length).toBe(1)
  const firstActive = activeBlocks[0]
  expect(firstActive instanceof HTMLElement && firstActive.dataset.title === 'app.ts').toBe(true)

  // Click second tab
  const secondTab = tabs[1]
  if (secondTab instanceof HTMLElement) {
    secondTab.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  }
  await settleApp()
  await settleApp()

  // Verify second tab is now active
  const activeBlocksAfter = app.container.querySelectorAll(
    '.slidev-code-group-blocks .slidev-code-block.active',
  )
  expect(activeBlocksAfter.length).toBe(1)
  const secondActive = activeBlocksAfter[0]
  expect(secondActive instanceof HTMLElement && secondActive.dataset.title === 'app.py').toBe(true)
})
