import { AppPage } from './test-utils/page-objects/app-page'
import { deck } from './test-utils/deck-builder'

it('Given a slide with v-mark When rendered Then the annotation wrapper is present', async () => {
  const md = deck()
    .title('VMark test')
    .slide('Mark demo', (s) => s.mark('important text', { type: 'underline', color: 'red' }))
    .build()

  using app = await AppPage.render({ markdown: md })

  const markEl = app.container.querySelector('.slidev-mark')
  expect(markEl).not.toBeNull()
  expect(markEl?.textContent).toContain('important text')
})

it('Given a slide with v-mark at click When presented and clicked Then annotation appears', async () => {
  const md = deck()
    .title('VMark click test')
    .slide('Click mark', (s) =>
      s.text('Some text').mark('highlighted', { type: 'underline', color: 'red', at: 1 }),
    )
    .build()

  using app = await AppPage.render({ markdown: md })

  const presentation = await app.present()
  presentation.expectOpen()

  // The mark element should exist
  const markEl = app.container.querySelector('.slidev-mark')
  expect(markEl).not.toBeNull()

  // After clicking, the annotation SVG should be added by rough-notation
  await presentation.next()

  // rough-notation adds an SVG element as a sibling
  const svg = app.container.querySelector('svg.rough-annotation')
  expect(svg).not.toBeNull()
})

it('Given a slide with v-mark without at When rendered in preview Then annotation shows immediately', async () => {
  const md = deck()
    .title('VMark immediate test')
    .slide('Immediate mark', (s) => s.mark('always visible', { type: 'box', color: 'blue' }))
    .build()

  using app = await AppPage.render({ markdown: md })

  // rough-notation should have already rendered the SVG
  const svg = app.container.querySelector('svg.rough-annotation')
  expect(svg).not.toBeNull()
})

it('Given v-mark with at attribute When processed by click processor Then totalClicks accounts for it', async () => {
  const md = deck()
    .title('VMark click count')
    .slide('Click count', (s) =>
      s.click('First click').mark('marked at 2', { type: 'highlight', at: 2 }),
    )
    .build()

  using app = await AppPage.render({ markdown: md })

  const presentation = await app.present()
  presentation.expectOpen()
  presentation.expectSlidePosition('1 / 1')

  // Should have 2 total clicks (1 for v-click, 1 for v-mark at=2)
  await presentation.next()
  presentation.expectClickPosition('(1/2)')

  await presentation.next()
  presentation.expectClickPosition('(2/2)')
})
