import { getMarkdown, settleApp } from './test-utils/app-browser'
import { AppPage, waitForSelector } from './test-utils/page-objects/app-page'
import { deck } from './test-utils/deck-builder'

it('should render diagram, media, and helper components when Slidev content blocks are present', async () => {
  const markdown = `# Slide blocks

<youtube id="dQw4w9WgXcQ" width="640" height="360"></youtube>
<arrow x1="10" y1="20" x2="110" y2="120" width="4" color="#ff5500"></arrow>
<powered-by-slidev />
`

  using app = await AppPage.render({ markdown })

  const youtube = app.container.querySelector<HTMLIFrameElement>('iframe.slidev-youtube')
  expect(youtube).toBeTruthy()
  expect(youtube?.src).toContain('https://www.youtube.com/embed/dQw4w9WgXcQ')
  expect(youtube?.getAttribute('width')).toBe('640')
  expect(youtube?.getAttribute('height')).toBe('360')

  const arrow = app.container.querySelector<SVGSVGElement>('svg.slidev-arrow')
  expect(arrow).toBeTruthy()
  expect(arrow?.querySelector('line')?.getAttribute('stroke')).toBe('#ff5500')
  expect(arrow?.querySelector('line')?.getAttribute('stroke-width')).toBe('4')

  expect(app.screen.getByText(/Powered by/i)).toBeTruthy()
  expect(app.screen.getByText(/Slidev/)).toBeTruthy()
})

it('should insert the fetched SVG when an icon tag renders', async () => {
  const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response('<svg viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>', {
      status: 200,
      headers: { 'Content-Type': 'image/svg+xml' },
    }),
  )

  try {
    const markdown = deck()
      .title('Icon test')
      .slide('Icons', (s) => s.text('<mdi:home />'))
      .build()

    using app = await AppPage.render({ markdown })

    await waitForSelector(app.container, '.slidev-icon svg')

    expect(fetchSpy).toHaveBeenCalledWith('https://api.iconify.design/mdi/home.svg')

    const svg = app.container.querySelector('.slidev-icon svg')
    expect(svg instanceof SVGElement).toBe(true)
  } finally {
    fetchSpy.mockRestore()
  }
})

it('should sync note sections and math highlights when presenting click-driven notes and KaTeX ranges', async () => {
  const markdown = `# Math clicks

Inline math stays visible: $E = mc^2$

$$ {1|2|1-2}
\\begin{align}
a &= b \\\\
c &= d
\\end{align}
$$

<!--
Before any clicks.

[click] After the first click.

[click] After the second click.
-->
`

  using app = await AppPage.render({ markdown })

  const inlineMath = app.container.querySelector('.katex')
  expect(inlineMath).toBeTruthy()

  const presentation = await app.present()
  await presentation.pressKey('n')

  presentation.expectSpeakerNotesVisible()
  presentation.expectSpeakerNotesText('Before any clicks.')

  // Spec `{1|2|1-2}` over a 2-row 2-column align: initially row 1 highlighted (2
  // nodes), row 2 dishonored (2 nodes).
  const visibleRowsAtStart = app.container.querySelectorAll('.slidev-katex-wrapper .highlighted')
  const hiddenRowsAtStart = app.container.querySelectorAll('.slidev-katex-wrapper .dishonored')
  expect(visibleRowsAtStart.length).toBe(2)
  expect(hiddenRowsAtStart.length).toBe(2)

  await presentation.next()
  presentation.expectSpeakerNotesText('After the first click.')

  // After first click: row 2 highlighted, row 1 dishonored.
  const visibleRowsAfterFirstClick = app.container.querySelectorAll(
    '.slidev-katex-wrapper .highlighted',
  )
  expect(visibleRowsAfterFirstClick.length).toBe(2)

  await presentation.next()
  presentation.expectSpeakerNotesText('After the second click.')

  const hiddenRowsAfterSecondClick = app.container.querySelectorAll(
    '.slidev-katex-wrapper .dishonored',
  )
  expect(hiddenRowsAfterSecondClick.length).toBe(0)
})

it('should update frontmatter and runtime font styles when the user picks a suggested font', async () => {
  const markdown = deck()
    .title('Typography')
    .slide('Fonts', (s) => s.text('Hello world'))
    .build()

  using app = await AppPage.render({ markdown })

  await app.openStyleSettings()

  const fontInputs = app.container.querySelectorAll<HTMLInputElement>('.font-input')
  const sansInput = fontInputs[0]
  expect(sansInput).toBeTruthy()

  if (!(sansInput instanceof HTMLInputElement)) {
    throw new Error('Expected sans font input to exist')
  }

  sansInput.dispatchEvent(new Event('focus', { bubbles: true }))
  sansInput.value = 'Space'
  sansInput.dispatchEvent(new Event('input', { bubbles: true }))
  await settleApp()

  const sansSuggestion = Array.from(
    app.container.querySelectorAll<HTMLElement>('.suggestion'),
  ).find((item) => item.textContent?.trim() === 'Space Grotesk')
  expect(sansSuggestion).toBeTruthy()
  if (!(sansSuggestion instanceof HTMLElement)) {
    throw new Error('Expected a sans font suggestion to exist')
  }
  sansSuggestion.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
  await settleApp()

  const updatedMarkdown = getMarkdown(app.screen)
  expect(updatedMarkdown).toContain('sans: Space Grotesk')

  app.expectFontFamilyVar('sans', 'Space Grotesk')
  app.expectFontLinkLoaded()
})
