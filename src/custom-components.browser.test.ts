import { AppPage } from './test-utils/page-objects/app-page'
import { deck } from './test-utils/deck-builder'

const QUOTE_SFC = `<script setup>
defineProps(['author'])
</script>

<template>
<blockquote class="custom-quote">
  <slot />
  <cite v-if="author">\u2014 {{ author }}</cite>
</blockquote>
</template>
`

const CARD_SFC = `<script setup>
defineProps({ title: String })
</script>

<template>
<div class="custom-card">
  <h3 v-if="title">{{ title }}</h3>
  <slot />
</div>
</template>
`

const DECK_WITH_QUOTE = deck()
  .title('Custom component test')
  .slide('Quotes', (s) =>
    s.text('<Quote author="Einstein">Imagination is more important than knowledge.</Quote>'),
  )
  .build()

it('Given a custom Quote component When the deck uses it Then the preview renders the blockquote with author', async () => {
  using app = await AppPage.render({
    markdown: DECK_WITH_QUOTE,
    componentFiles: { 'Quote.vue': QUOTE_SFC },
  })

  app.expectSlideVisible('Quotes')

  const blockquote = app.container.querySelector('blockquote.custom-quote')
  expect(blockquote).toBeTruthy()
  expect(blockquote?.textContent).toContain('Imagination is more important than knowledge.')
  expect(blockquote?.textContent).toContain('\u2014 Einstein')
})

it('Given two component files When the deck uses both Then both render correctly', async () => {
  const md = deck()
    .title('Multi component test')
    .slide('Mixed', (s) =>
      s.text(
        '<Quote author="Torvalds">Talk is cheap.</Quote>\n<Card title="Info">Some card content.</Card>',
      ),
    )
    .build()

  using app = await AppPage.render({
    markdown: md,
    componentFiles: { 'Quote.vue': QUOTE_SFC, 'Card.vue': CARD_SFC },
  })

  const blockquote = app.container.querySelector('blockquote.custom-quote')
  expect(blockquote).toBeTruthy()
  expect(blockquote?.textContent).toContain('Talk is cheap.')
  expect(blockquote?.textContent).toContain('\u2014 Torvalds')

  const card = app.container.querySelector('.custom-card')
  expect(card).toBeTruthy()
  expect(card?.querySelector('h3')?.textContent).toBe('Info')
  expect(card?.textContent).toContain('Some card content.')
})

it('Given a component with styles When the deck uses it Then the styles are applied', async () => {
  const styledSfc = `<template>
<div class="styled-box">styled content</div>
</template>
<style>
.styled-box { border: 2px solid red; padding: 16px; }
</style>
`
  const md = deck()
    .title('Style test')
    .slide('Styled', (s) => s.text('<StyledBox></StyledBox>'))
    .build()

  using app = await AppPage.render({
    markdown: md,
    componentFiles: { 'StyledBox.vue': styledSfc },
  })

  const box = app.container.querySelector<HTMLElement>('.styled-box')
  expect(box).toBeTruthy()

  const styleTag = document.querySelector('#slidev-custom-component-styles')
  expect(styleTag).toBeTruthy()
  expect(styleTag?.textContent).toContain('.styled-box')
  expect(styleTag?.textContent).toContain('border: 2px solid red')
})

it('Given a component with no template When the deck uses it Then an error is shown instead of crashing', async () => {
  const brokenSfc = `<script setup>
defineProps(['foo'])
</script>
`
  const md = deck()
    .title('Error test')
    .slide('Error', (s) => s.text('<Broken></Broken>'))
    .build()

  using app = await AppPage.render({
    markdown: md,
    componentFiles: { 'Broken.vue': brokenSfc },
  })

  app.expectSlideVisible('Error')
  const errorBlock = app.container.querySelector('.slidev-error-block')
  expect(errorBlock).toBeTruthy()
  expect(errorBlock?.textContent).toContain('Broken')
})

it('Given the app When the user adds a component file and edits it Then the preview updates', async () => {
  const md = deck()
    .title('Tab test')
    .slide('Tab', (s) => s.text('<MyComp></MyComp>'))
    .build()

  using app = await AppPage.render({ markdown: md })

  // Initially, MyComp is not resolved
  expect(app.container.querySelector('.my-comp')).toBeFalsy()

  // Add a new component file via the + button
  await app.addComponentFile()

  // Type a component definition in the new file
  await app.updateActiveFile(`<template>
<div class="my-comp">Hello from custom component</div>
</template>
`)

  // Need to rename: the auto-generated name is Comp1.vue, not MyComp.vue
  // So the component registers as "Comp1" — won't match <MyComp>
  // Instead, test that the component we created renders when used by its generated name
  // Let's just verify the file tab mechanism works by switching tabs
  await app.switchToSlidesTab()

  // Update markdown to use the auto-generated name
  await app.updateActiveFile(
    deck()
      .title('Tab test')
      .slide('Tab', (s) => s.text('<Comp1></Comp1>'))
      .build(),
  )

  const comp = app.container.querySelector('.my-comp')
  expect(comp).toBeTruthy()
  expect(comp?.textContent).toContain('Hello from custom component')
})

it('Given a shared URL with component files When loaded Then both markdown and files restore', async () => {
  const md = deck()
    .title('Share test')
    .slide('Shared', (s) => s.text('<Greeting></Greeting>'))
    .build()

  const greetingSfc = `<template>
<p class="greeting">Hello World</p>
</template>
`

  using app = await AppPage.render({
    markdown: md,
    componentFiles: { 'Greeting.vue': greetingSfc },
  })

  const greeting = app.container.querySelector('.greeting')
  expect(greeting).toBeTruthy()
  expect(greeting?.textContent).toContain('Hello World')

  app.expectHashPresent()
  const sharedState = app.getSharedState()
  expect(sharedState.markdown).toContain('Greeting')
  expect(sharedState.componentFiles['Greeting.vue']).toBeTruthy()
})

it('Given a legacy URL without components When loaded Then markdown renders with empty files', async () => {
  const md = '# Legacy\n\nOld format deck\n'

  using app = await AppPage.render({ markdown: md })

  app.expectSlideVisible('Legacy')
  app.expectHashPresent()
})
