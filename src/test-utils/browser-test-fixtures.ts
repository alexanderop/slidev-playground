import { deck } from './deck-builder'

export const TWO_SLIDE_DECK = deck()
  .title('Browser flow test')
  .fonts({ sans: 'Poppins', mono: 'JetBrains Mono' })
  .theme('#4fc08d')
  .slide('Intro', (s) =>
    s
      .text('Welcome to the browser flow test.')
      .click('First reveal')
      .click('Second reveal')
      .note('Remember to pause on each reveal.'),
  )
  .slide('Final slide', (s) => s.text('Done.'))
  .build()

export const SMALL_CANVAS_DECK = deck()
  .title('Small canvas preview test')
  .canvasWidth(40)
  .slide('Compact slide', (s) => s.text('This slide should scale up to fill the preview pane.'))
  .build()

export const CORE_PARITY_DECK = deck()
  .title('Core parity')
  .slide('Click syntax', (s) =>
    s
      .click('Step one')
      .clickAfter('Step one with after')
      .clicks(['Item one', 'Item two', 'Item three']),
  )
  .slide(undefined, (s) =>
    s
      .import('./src/test-fixtures/import-range-slides.md#2-3')
      .slideClass('range-import')
      .layout('end'),
  )
  .slide('Embedded content', (s) =>
    s.text('Iframe side content.').iframeUrl('https://example.com/demo'),
  )
  .slide(undefined, (s) =>
    s.layout('none').code('const one = 1\nconst two = 2\nconst three = 3\nconst four = 4', {
      filename: 'demo.ts',
      lines: true,
      startLine: 5,
      highlights: '2-3|4|all',
    }),
  )
  .build()

export const CODE_STYLING_DECK = deck()
  .title('Code styling test')
  .slide('Code with highlights', (s) =>
    s.code('const a = 1\nconst b = 2\nconst c = 3\nconst d = 4', {
      highlights: '2-3',
    }),
  )
  .slide('Code without highlights', (s) =>
    s.code("const x = 'no highlights here'\nconst y = 'plain code block'"),
  )
  .slide('Code with filename', (s) =>
    s.code('export function add(a: number, b: number) {\n  return a + b\n}', {
      filename: 'utils.ts',
    }),
  )
  .build()

export const NAV_CLICK_DECK = deck()
  .title('Nav click test')
  .slide('Cover', (s) => s.text('<div class="nav-trigger" @click="$slidev.nav.next">Go next</div>'))
  .slide('Second slide', (s) => s.text('Done.'))
  .build()
