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

  // The auto-generated filename is Comp1.vue, so the registered tag is <Comp1>.
  // Switch back to slides and update markdown to use the generated tag.
  await app.switchToSlidesTab()

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

it('Given a legacy URL without components When loaded Then markdown renders with empty files', async () => {
  const md = '# Legacy\n\nOld format deck\n'

  using app = await AppPage.render({ markdown: md })

  app.expectSlideVisible('Legacy')
  app.expectHashPresent()
})
