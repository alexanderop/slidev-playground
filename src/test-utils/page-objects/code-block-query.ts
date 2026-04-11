export class CodeBlockQuery {
  constructor(
    private readonly container: Element,
    private readonly index: number,
  ) {}

  private get frame(): Element {
    const frames = this.container.querySelectorAll('.slidev-code-frame')
    const frame = frames[this.index]
    if (frame === undefined) {
      throw new Error(`Expected code block at index ${this.index}, but only found ${frames.length}`)
    }
    return frame
  }

  expectLineCount(count: number) {
    const lines = this.frame.querySelectorAll('.line')
    expect(lines.length).toBe(count)
  }

  expectHighlightedLines(lines: string[]) {
    const highlighted = [...this.frame.querySelectorAll<HTMLElement>('.line.highlighted')]
      .map((line) => line.dataset.line)
      .filter((line): line is string => line !== undefined)
    expect(highlighted).toEqual(lines)
  }

  expectDishonoredLines(lines: string[]) {
    const dishonored = [...this.frame.querySelectorAll<HTMLElement>('.line.dishonored')]
      .map((line) => line.dataset.line)
      .filter((line): line is string => line !== undefined)
    expect(dishonored).toEqual(lines)
  }

  expectNoHighlights() {
    expect(this.frame.querySelectorAll('.line.highlighted').length).toBe(0)
  }

  expectNoDishonored() {
    expect(this.frame.querySelectorAll('.line.dishonored').length).toBe(0)
  }

  expectHighlightedCount(count: number) {
    expect(this.frame.querySelectorAll('.line.highlighted').length).toBe(count)
  }

  expectDishonoredCount(count: number) {
    expect(this.frame.querySelectorAll('.line.dishonored').length).toBe(count)
  }
}
