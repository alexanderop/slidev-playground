export class MeasurementHelper {
  constructor(private readonly getContainer: () => Element) {}

  previewWidths() {
    const container = this.getContainer()
    const previewSlide = container.querySelector('.preview-slide')
    const slideContent = container.querySelector('.preview-slide .slidev-slide-content')

    if (!(previewSlide instanceof HTMLElement) || !(slideContent instanceof HTMLElement)) {
      throw new Error('Expected preview slide and slide content to exist')
    }

    return {
      previewWidth: previewSlide.getBoundingClientRect().width,
      contentWidth: slideContent.getBoundingClientRect().width,
    }
  }

  slideCanvas() {
    const container = this.getContainer()
    const slideContent = container.querySelector('.preview-slide .slidev-slide-content')

    if (!(slideContent instanceof HTMLElement)) {
      throw new Error('Expected preview slide content to exist')
    }

    return {
      width: slideContent.style.width,
      height: slideContent.style.height,
    }
  }
}
