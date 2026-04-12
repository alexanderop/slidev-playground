import { AppPage } from './test-utils/page-objects/app-page'
import { deck } from './test-utils/deck-builder'

it('should reveal an element at an absolute click position when v-click has a numeric value', async () => {
  const md = deck()
    .slide('Absolute Click', (s) =>
      s.text('Always visible').clickAt('Appears at three', 3).click('Appears at four'),
    )
    .build()

  using app = await AppPage.render({ markdown: md })
  const presentation = await app.present()

  presentation.expectTextHidden('Appears at three')
  presentation.expectTextHidden('Appears at four')

  await presentation.next()
  presentation.expectClickPosition('(1/4)')
  presentation.expectTextHidden('Appears at three')

  await presentation.next()
  presentation.expectClickPosition('(2/4)')
  presentation.expectTextHidden('Appears at three')

  await presentation.next()
  presentation.expectClickPosition('(3/4)')
  presentation.expectTextVisible('Appears at three')
  presentation.expectTextHidden('Appears at four')

  await presentation.next()
  presentation.expectClickPosition('(4/4)')
  presentation.expectTextVisible('Appears at four')
})

it('should hide an element after its click when v-click-hide is used with v-after', async () => {
  const md = deck()
    .slide('Hide Click', (s) => s.clickHide('Will vanish').clickAfter('Will appear'))
    .build()

  using app = await AppPage.render({ markdown: md })
  const presentation = await app.present()

  // Before click: hide element is visible, show element is hidden
  presentation.expectTextVisible('Will vanish')
  presentation.expectTextHidden('Will appear')

  // After click: hide element disappears, show element appears (same click step via v-after)
  await presentation.next()
  presentation.expectClickPosition('(1/1)')
  presentation.expectTextHidden('Will vanish')
  presentation.expectTextVisible('Will appear')
})

it('should group items by the every attribute when v-clicks has every set', async () => {
  const md = deck()
    .slide('Every', (s) => s.clicksEvery(['Alpha', 'Bravo', 'Charlie', 'Delta'], 2))
    .build()

  using app = await AppPage.render({ markdown: md })
  const presentation = await app.present()

  presentation.expectTextHidden('Alpha')
  presentation.expectTextHidden('Bravo')
  presentation.expectTextHidden('Charlie')
  presentation.expectTextHidden('Delta')

  await presentation.next()
  presentation.expectClickPosition('(1/2)')
  presentation.expectTextVisible('Alpha')
  presentation.expectTextVisible('Bravo')
  presentation.expectTextHidden('Charlie')
  presentation.expectTextHidden('Delta')

  await presentation.next()
  presentation.expectClickPosition('(2/2)')
  presentation.expectTextVisible('Charlie')
  presentation.expectTextVisible('Delta')
})

it('should reveal nested list items when v-clicks has a depth attribute', async () => {
  const nestedHtml = `<ul v-clicks depth="2">
  <li><span>Parent A</span>
    <ul>
      <li>Child A1</li>
      <li>Child A2</li>
    </ul>
  </li>
  <li>Parent B</li>
</ul>`

  const md = deck()
    .slide('Depth', (s) => s.clicksDepth(nestedHtml))
    .build()

  using app = await AppPage.render({ markdown: md })
  const presentation = await app.present()

  presentation.expectTextHidden('Parent B')

  await presentation.next()
  presentation.expectClickPosition('(1/4)')
  presentation.expectTextHidden('Child A1')

  await presentation.next()
  presentation.expectClickPosition('(2/4)')
  presentation.expectTextVisible('Child A1')
  presentation.expectTextHidden('Child A2')

  await presentation.next()
  presentation.expectClickPosition('(3/4)')
  presentation.expectTextVisible('Child A2')
  presentation.expectTextHidden('Parent B')

  await presentation.next()
  presentation.expectClickPosition('(4/4)')
  presentation.expectTextVisible('Parent B')
})

it('should show an element only within a click range when v-click has an array value', async () => {
  const md = deck()
    .slide('Range', (s) =>
      s
        .click('Step one')
        .click('Step two')
        .clickRange('Visible 2-3', [2, 4])
        .click('Step three')
        .click('Step four'),
    )
    .build()

  using app = await AppPage.render({ markdown: md })
  const presentation = await app.present()

  presentation.expectTextHidden('Visible 2-3')

  await presentation.next()
  presentation.expectClickPosition('(1/4)')
  presentation.expectTextHidden('Visible 2-3')

  await presentation.next()
  presentation.expectClickPosition('(2/4)')
  presentation.expectTextVisible('Visible 2-3')

  await presentation.next()
  presentation.expectClickPosition('(3/4)')
  presentation.expectTextVisible('Visible 2-3')

  await presentation.next()
  presentation.expectClickPosition('(4/4)')
  presentation.expectTextHidden('Visible 2-3')
})
