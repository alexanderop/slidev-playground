import { splitSlideSlots } from './slots'

describe('splitSlideSlots', () => {
  it('splits default and named slots using Slidev slot sugar', () => {
    expect(
      splitSlideSlots(`# Title

Left column

::right::

Right column`),
    ).toEqual([
      {
        name: 'default',
        content: '# Title\n\nLeft column',
      },
      {
        name: 'right',
        content: 'Right column',
      },
    ])
  })
})
