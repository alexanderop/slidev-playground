import { PREVIEW_PADDING } from '../constants'
import { getPreviewSlideScale } from './useSlideScale'

describe('getPreviewSlideScale', () => {
  it('downscales when the preview pane is narrower than the slide canvas', () => {
    expect(getPreviewSlideScale(800, 960)).toBe((800 - PREVIEW_PADDING) / 960)
  })

  it('upscales when the preview pane is wider than the slide canvas', () => {
    expect(getPreviewSlideScale(1600, 960)).toBe((1600 - PREVIEW_PADDING) / 960)
  })

  it('never returns a negative scale', () => {
    expect(getPreviewSlideScale(40, 960)).toBe(0)
  })
})
