/**
 * Filters speaker notes HTML by click markers.
 * Segments delimited by `[click]` or `[click:N]` are progressively
 * revealed as `currentClick` increases.
 */
export function filterNotesByClick(html: string, currentClick: number): string {
  if (!html.includes('[click')) {
    return html
  }

  const segments = html.split(/\[click(?::(\d+))?\]/)
  let result = segments[0]
  let clickCounter = 0

  for (let i = 1; i < segments.length; i += 2) {
    const skip = segments[i] === undefined ? 1 : Number.parseInt(segments[i], 10)
    clickCounter += skip
    const content = segments[i + 1] ?? ''
    if (clickCounter <= currentClick) {
      result += content
    }
  }

  return result
}
