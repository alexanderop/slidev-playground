import { pressKey, settleApp } from './test-utils/app-browser'
import { AppPage } from './test-utils/page-objects/app-page'
import { deck } from './test-utils/deck-builder'

const SIMPLE_DECK = deck()
  .title('Vim toggle')
  .slide('Hello', (s) => s.text('Edit me'))
  .build()

function vimToggle(app: AppPage) {
  return app.screen.getByRole('button', { name: 'Vim mode' })
}

function vimTogglePressed(app: AppPage) {
  return app.container.querySelector('[aria-label="Vim mode"]')?.getAttribute('aria-pressed')
}

function modeBadge(app: AppPage) {
  return app.container.querySelector('[role="status"]')
}

async function waitForBadge(app: AppPage, timeoutMs = 2000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const el = modeBadge(app)
    if (el) {
      return el
    }
    // eslint-disable-next-line no-await-in-loop
    await settleApp()
  }
  throw new Error('Timed out waiting for vim mode badge')
}

async function focusEditor(app: AppPage) {
  const content = app.container.querySelector<HTMLElement>('.cm-content')
  if (!content) {
    throw new Error('Expected CodeMirror content element')
  }
  content.focus()
  await settleApp()
}

it('Given the editor When vim is off Then no mode badge is shown and the toggle reads unpressed', async () => {
  using app = await AppPage.render({ markdown: SIMPLE_DECK })

  expect(vimTogglePressed(app)).toBe('false')
  expect(modeBadge(app)).toBeNull()
})

it('Given vim is off When the user clicks the toggle Then vim turns on and the NORMAL badge appears', async () => {
  using app = await AppPage.render({ markdown: SIMPLE_DECK })

  await vimToggle(app).click()
  const badge = await waitForBadge(app)

  expect(vimTogglePressed(app)).toBe('true')
  expect(badge.textContent).toContain('NORMAL')
})

it('Given vim is on When the user presses i then Escape Then the badge tracks INSERT and NORMAL', async () => {
  using app = await AppPage.render({ markdown: SIMPLE_DECK })

  await vimToggle(app).click()
  await waitForBadge(app)
  await focusEditor(app)

  await pressKey('i')
  expect(modeBadge(app)?.textContent).toContain('INSERT')

  await pressKey('Escape')
  expect(modeBadge(app)?.textContent).toContain('NORMAL')
})

it('Given vim is on When the user toggles vim off Then the mode badge disappears', async () => {
  using app = await AppPage.render({ markdown: SIMPLE_DECK })

  await vimToggle(app).click()
  await waitForBadge(app)

  await vimToggle(app).click()
  await settleApp()
  expect(modeBadge(app)).toBeNull()
  expect(vimTogglePressed(app)).toBe('false')
})
