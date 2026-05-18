import { AppPage } from './test-utils/page-objects/app-page'
import { settleApp } from './test-utils/app-browser'
import { TWO_SLIDE_DECK } from './test-utils/browser-test-fixtures'

const VALID_COMPONENT = `<script setup>
const x = 1
</script>

<template>
  <div class="from-original">original</div>
</template>
`

function getTab(app: AppPage, namePattern: RegExp) {
  return app.screen.getByRole('button', { name: namePattern })
}

async function dblclick(element: Element) {
  element.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }))
  await settleApp()
}

function requireRenameInput(app: AppPage): HTMLInputElement {
  const input = app.container.querySelector('.pane-tab-rename')
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('Expected .pane-tab-rename input to exist')
  }
  return input
}

it('Given a component tab When the user double-clicks it Then an input with the current name appears focused', async () => {
  using app = await AppPage.render({
    markdown: TWO_SLIDE_DECK,
    componentFiles: { 'Comp1.vue': VALID_COMPONENT },
  })

  const tab = getTab(app, /^Comp1\.vue/)
  await dblclick(tab.element())

  const input = requireRenameInput(app)
  expect(input.value).toBe('Comp1.vue')
  expect(document.activeElement).toBe(input)
})

it('Given the rename input When the user submits a new .vue name Then the file is renamed and content preserved', async () => {
  using app = await AppPage.render({
    markdown: TWO_SLIDE_DECK,
    componentFiles: { 'Comp1.vue': VALID_COMPONENT },
  })

  const tab = getTab(app, /^Comp1\.vue/)
  await dblclick(tab.element())

  const input = requireRenameInput(app)
  input.value = 'Hero.vue'
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }))
  await settleApp()

  expect(app.container.querySelector('.pane-tab-rename')).toBeNull()
  expect(app.screen.getByRole('button', { name: /^Hero\.vue/ })).toBeTruthy()
  expect(app.container.querySelector('[aria-label="Remove Hero.vue"]')).toBeTruthy()
})

it('Given the rename input When Esc is pressed Then no rename happens', async () => {
  using app = await AppPage.render({
    markdown: TWO_SLIDE_DECK,
    componentFiles: { 'Comp1.vue': VALID_COMPONENT },
  })

  const tab = getTab(app, /^Comp1\.vue/)
  await dblclick(tab.element())

  const input = requireRenameInput(app)
  input.value = 'Hero.vue'
  input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape', bubbles: true }))
  await settleApp()

  expect(app.container.querySelector('.pane-tab-rename')).toBeNull()
  expect(app.screen.getByRole('button', { name: /^Comp1\.vue/ })).toBeTruthy()
})

it('Given the rename input When blurred Then the rename is committed', async () => {
  using app = await AppPage.render({
    markdown: TWO_SLIDE_DECK,
    componentFiles: { 'Comp1.vue': VALID_COMPONENT },
  })

  const tab = getTab(app, /^Comp1\.vue/)
  await dblclick(tab.element())

  const input = requireRenameInput(app)
  input.value = 'Card.vue'
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new FocusEvent('blur', { bubbles: true }))
  await settleApp()

  expect(app.container.querySelector('.pane-tab-rename')).toBeNull()
  expect(app.screen.getByRole('button', { name: /^Card\.vue/ })).toBeTruthy()
})

it('Given a duplicate name When the user submits Then the rename is rejected and an error shows in the overlay', async () => {
  using app = await AppPage.render({
    markdown: TWO_SLIDE_DECK,
    componentFiles: {
      'Comp1.vue': VALID_COMPONENT,
      'Comp2.vue': VALID_COMPONENT,
    },
  })

  const tab = getTab(app, /^Comp1\.vue/)
  await dblclick(tab.element())

  const input = requireRenameInput(app)
  input.value = 'Comp2.vue'
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }))
  await settleApp()

  const overlay = app.container.querySelector('.editor-error-overlay')
  expect(overlay instanceof HTMLElement).toBe(true)
  expect(overlay?.textContent ?? '').toMatch(/already exists/i)
  expect(app.screen.getByRole('button', { name: /^Comp1\.vue/ })).toBeTruthy()
})

it('Given a non-.vue name When the user submits Then the rename is rejected', async () => {
  using app = await AppPage.render({
    markdown: TWO_SLIDE_DECK,
    componentFiles: { 'Comp1.vue': VALID_COMPONENT },
  })

  const tab = getTab(app, /^Comp1\.vue/)
  await dblclick(tab.element())

  const input = requireRenameInput(app)
  input.value = 'bad.txt'
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }))
  await settleApp()

  const overlay = app.container.querySelector('.editor-error-overlay')
  expect(overlay instanceof HTMLElement).toBe(true)
  expect(app.screen.getByRole('button', { name: /^Comp1\.vue/ })).toBeTruthy()
})

it('Given the slides.md tab When the user double-clicks it Then no rename input appears', async () => {
  using app = await AppPage.render({ markdown: TWO_SLIDE_DECK })

  const tab = app.screen.getByRole('button', { name: 'slides.md' })
  await dblclick(tab.element())

  expect(app.container.querySelector('.pane-tab-rename')).toBeNull()
})
