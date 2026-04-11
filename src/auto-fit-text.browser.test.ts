import { AppPage } from './test-utils/page-objects/app-page'
import { deck } from './test-utils/deck-builder'

it('should render AutoFitText and apply dynamic font size', async () => {
  const md = deck()
    .title('AutoFit')
    .slide('AutoFit', (s) => s.text('<AutoFitText :max="80" :min="20">Hello World</AutoFitText>'))
    .build()

  using app = await AppPage.render({ markdown: md })

  const container = app.container.querySelector('.slidev-auto-fit-text')
  expect(container).not.toBeNull()

  const inner = container?.querySelector('.slidev-auto-fit-text-inner')
  expect(inner).not.toBeNull()
  expect(inner?.textContent?.trim()).toBe('Hello World')

  // Font size should be applied via CSS v-bind
  if (!container) {
    throw new Error('container not found')
  }
  const style = window.getComputedStyle(container)
  const fontSize = parseFloat(style.fontSize)
  expect(fontSize).toBeGreaterThanOrEqual(20)
  expect(fontSize).toBeLessThanOrEqual(80)
})
