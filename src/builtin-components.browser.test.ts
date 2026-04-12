import { settleApp } from './test-utils/app-browser'
import { AppPage } from './test-utils/page-objects/app-page'
import { deck } from './test-utils/deck-builder'

it('should display the current slide number when SlideCurrentNo is used in a slide', async () => {
  const md = deck()
    .slide('First', (s) => s.text('Slide <SlideCurrentNo /> of deck'))
    .slide('Second', (s) => s.text('Now on <SlideCurrentNo />'))
    .build()

  using app = await AppPage.render({ markdown: md })
  const presentation = await app.present()

  presentation.expectSlidePosition('1 / 2')
  expect(app.screen.getByText('Slide 1 of deck')).toBeTruthy()

  await presentation.pressShortcut('ArrowDown')
  presentation.expectSlidePosition('2 / 2')
  expect(app.screen.getByText('Now on 2')).toBeTruthy()
})

it('should display the total slide count when SlidesTotal is used in a slide', async () => {
  const md = deck()
    .slide('A', (s) => s.text('Total: <SlidesTotal />'))
    .slide('B')
    .slide('C')
    .build()

  using app = await AppPage.render({ markdown: md })
  const _presentation = await app.present()

  expect(app.screen.getByText('Total: 3')).toBeTruthy()
})

it('should apply CSS transform when the Transform component wraps content', async () => {
  const md = deck()
    .slide('Scaled', (s) =>
      s.text('<Transform scale="1.5" origin="center center"><p>Big text</p></Transform>'),
    )
    .build()

  using app = await AppPage.render({ markdown: md })
  const presentation = await app.present()
  presentation.expectOpen()

  // Find the Transform wrapper by locating the "Big text" child content and
  // walking up to the nearest ancestor that has an inline transform applied.
  // The Transform component renders a div with inline transform styles. The
  // child `<p>Big text</p>` tag isn't necessarily preserved through markdown-it
  // parsing of inline-HTML-inside-component, so we assert purely on the
  // rendered wrapper's inline style (the user-visible transform effect).
  const wrapper = [...app.container.querySelectorAll<HTMLElement>('*')].find(
    (el) => el.style.transform === 'scale(1.5)',
  )
  if (!wrapper) {
    throw new Error('Expected Transform wrapper element with scale(1.5)')
  }
  expect(wrapper.style.transformOrigin).toBe('center center')
})

it('should show light or dark content when LightOrDark component is used', async () => {
  const md = deck()
    .slide('Theme', (s) =>
      s.text(
        '<LightOrDark><template v-slot:light><span class="light-content">LIGHT MODE</span></template><template v-slot:dark><span class="dark-content">DARK MODE</span></template></LightOrDark>',
      ),
    )
    .build()

  using app = await AppPage.render({ markdown: md })
  const presentation = await app.present()

  const findText = (text: string) =>
    [...app.container.querySelectorAll<HTMLElement>('.present-slide *')].find(
      (el) => el.textContent?.trim() === text,
    )

  // Default is light mode
  expect(findText('LIGHT MODE')).toBeTruthy()
  expect(findText('DARK MODE')).toBeUndefined()

  // Toggle dark mode
  await presentation.pressKey('d')
  expect(findText('DARK MODE')).toBeTruthy()
  expect(findText('LIGHT MODE')).toBeUndefined()
})

it('should render a video element when SlidevVideo is used in a slide', async () => {
  const md = deck()
    .slide('Video', (s) =>
      s.text('<SlidevVideo controls><source src="test.mp4" type="video/mp4" /></SlidevVideo>'),
    )
    .build()

  using app = await AppPage.render({ markdown: md })
  await app.present()

  const video = app.container.querySelector<HTMLVideoElement>('.present-slide video')
  if (!video) {
    throw new Error('Expected video element')
  }
  expect(video.controls).toBe(true)
  const source = video.querySelector('source')
  expect(source?.getAttribute('src')).toBe('test.mp4')
})

it('should navigate to a target slide when SlidevLink is clicked', async () => {
  const md = deck()
    .slide('Start', (s) => s.text('<SlidevLink to="3">Jump to three</SlidevLink>'))
    .slide('Middle')
    .slide('Target')
    .build()

  using app = await AppPage.render({ markdown: md })
  const presentation = await app.present()
  presentation.expectSlidePosition('1 / 3')

  // Use a DOM-level click: Playwright's pointer click is intercepted by the
  // full-slide click-advance handler. The anchor is queried by its accessible
  // name ("Jump to three") rather than by tag selector.
  const link = [...app.container.querySelectorAll<HTMLAnchorElement>('.present-slide a')].find(
    (el) => el.textContent?.trim() === 'Jump to three',
  )
  if (!link) {
    throw new Error('Expected SlidevLink anchor with name "Jump to three"')
  }
  link.click()
  await settleApp()
  await settleApp()

  presentation.expectSlidePosition('3 / 3')
})

it('should cycle through children on click when v-switch is used', async () => {
  const md = deck()
    .slide('Switch', (s) =>
      s.text('<v-switch>\n<div>First</div>\n<div>Second</div>\n<div>Third</div>\n</v-switch>'),
    )
    .build()

  using app = await AppPage.render({ markdown: md })
  const presentation = await app.present()

  presentation.expectTextVisible('First')
  presentation.expectTextHidden('Second')
  presentation.expectTextHidden('Third')

  await presentation.next()
  presentation.expectClickPosition('(1/2)')
  presentation.expectTextHidden('First')
  presentation.expectTextVisible('Second')
  presentation.expectTextHidden('Third')

  await presentation.next()
  presentation.expectClickPosition('(2/2)')
  presentation.expectTextHidden('First')
  presentation.expectTextHidden('Second')
  presentation.expectTextVisible('Third')
})
