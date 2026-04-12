export type SlideSlotContent = {
  name: string
  content: string
}

const SLOT_RE = /^::\s*([\w.\-:]+)\s*::\s*$/

export function splitSlideSlots(content: string): SlideSlotContent[] {
  const lines = content.split('\n')
  const slots: SlideSlotContent[] = []

  let currentSlot = 'default'
  let buffer: string[] = []

  function commit() {
    if (buffer.length === 0 && slots.some((slot) => slot.name === currentSlot)) {
      return
    }
    slots.push({
      name: currentSlot,
      content: buffer.join('\n').trim(),
    })
    buffer = []
  }

  for (const line of lines) {
    const match = line.match(SLOT_RE)
    if (match) {
      commit()
      currentSlot = match[1]
      continue
    }
    buffer.push(line)
  }

  commit()

  return slots.filter((slot, index) => slot.content !== '' || index === 0)
}
