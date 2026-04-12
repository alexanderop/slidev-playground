import { parsePositiveInt } from '../../utils/type-guards'

export type ClickResult = {
  readonly html: string
  readonly totalClicks: number
}

const CLICK_DIRECTIVE_ATTRS = [
  'v-click',
  'v-click.hide',
  'v-click-hide',
  'v-clicks',
  'v-after',
  'v-switch',
  'every',
  'depth',
] as const

const CLICK_DIRECTIVE_ATTR_SET: ReadonlySet<string> = new Set(CLICK_DIRECTIVE_ATTRS)

function stripDirectiveAttrs(el: HTMLElement) {
  for (const attr of CLICK_DIRECTIVE_ATTRS) {
    el.removeAttribute(attr)
  }
}

type ClickState = {
  // Monotonic counter used to compute the next sequential step and to
  // track the maximum click across the slide.
  clickIndex: number
  // Sequential counter used to allocate the next `v-click` step.
  // Range elements (e.g. `v-click="[2, 4]"`) extend `clickIndex` without
  // advancing this value, so subsequent sequential clicks stay adjacent.
  sequentialClick: number
  lastAssignedClick: number
}

export function processClicks(html: string): ClickResult {
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html')
  const container = doc.body.firstElementChild
  if (!(container instanceof HTMLElement)) {
    throw new Error('processClicks: failed to parse HTML fragment into a container element')
  }
  const state: ClickState = {
    clickIndex: 0,
    sequentialClick: 0,
    lastAssignedClick: 0,
  }

  processNode(container, state)

  return {
    html: container.innerHTML,
    totalClicks: state.clickIndex,
  }
}

function processNode(node: Node, state: ClickState) {
  const children = [...node.childNodes]

  for (const child of children) {
    if (child.nodeType === Node.COMMENT_NODE) {
      processLegacyClickComment(child, state)
      continue
    }

    if (!(child instanceof HTMLElement)) {
      continue
    }

    const normalizedChild = normalizeCustomTag(child)

    if (isSwitchContainer(normalizedChild)) {
      processSwitchContainer(normalizedChild, state)
      continue
    }

    if (isClicksContainer(normalizedChild)) {
      processClicksContainer(normalizedChild, state)
      stripDirectiveAttrs(normalizedChild)
      continue
    }

    const isClick = isClickElement(normalizedChild)
    if (isClick) {
      applyClickDirective(normalizedChild, state)
      stripDirectiveAttrs(normalizedChild)
    }
    if (!isClick && isAfterElement(normalizedChild)) {
      applyClickToElement(normalizedChild, Math.max(1, state.lastAssignedClick), state)
      stripDirectiveAttrs(normalizedChild)
    }

    if (isMarkElement(normalizedChild)) {
      countMarkClick(normalizedChild, state)
    }

    processNode(normalizedChild, state)
  }
}

function processLegacyClickComment(node: ChildNode, state: ClickState) {
  if (node.textContent?.trim() !== 'v-click') {
    return
  }

  let sibling = node.nextSibling
  while (sibling && sibling.nodeType !== Node.ELEMENT_NODE) {
    sibling = sibling.nextSibling
  }

  if (sibling instanceof HTMLElement) {
    applyClickToElement(sibling, state.sequentialClick + 1, state)
  }

  node.remove()
}

function processClicksContainer(container: HTMLElement, state: ClickState) {
  const everyAttr = container.getAttribute('every')
  const depthAttr = container.getAttribute('depth')

  if (depthAttr !== null) {
    const depth = parsePositiveInt(depthAttr)
    if (depth !== null && depth > 0) {
      const leaves = collectLeavesAtDepth(container, depth)
      for (const leaf of leaves) {
        applyClickToElement(leaf, state.sequentialClick + 1, state)
      }
      return
    }
  }

  const directChildren = [...container.children].filter(
    (child): child is HTMLElement => child instanceof HTMLElement,
  )

  if (everyAttr !== null) {
    const every = parsePositiveInt(everyAttr)
    if (every !== null && every > 0) {
      const base = state.sequentialClick
      for (const [i, child] of directChildren.entries()) {
        const step = base + Math.floor(i / every) + 1
        applyClickToElement(child, step, state)
      }
      return
    }
  }

  for (const child of directChildren) {
    applyClickToElement(child, state.sequentialClick + 1, state)
  }
}

function collectLeavesAtDepth(root: HTMLElement, maxDepth: number): HTMLElement[] {
  // Depth-first pre-order traversal — emit each `<li>` up to `maxDepth`
  // levels in document order (parent before children).
  const leaves: HTMLElement[] = []

  function walk(list: HTMLElement, currentDepth: number) {
    if (currentDepth > maxDepth) {
      return
    }
    const items = [...list.children].filter(
      (child): child is HTMLElement => child instanceof HTMLElement && child.tagName === 'LI',
    )
    for (const item of items) {
      leaves.push(item)
      const nestedList = [...item.children].find(
        (child): child is HTMLElement =>
          child instanceof HTMLElement && (child.tagName === 'UL' || child.tagName === 'OL'),
      )
      if (nestedList) {
        walk(nestedList, currentDepth + 1)
      }
    }
  }

  walk(root, 1)
  return leaves
}

function processSwitchContainer(container: HTMLElement, state: ClickState) {
  const directChildren = [...container.children].filter(
    (child): child is HTMLElement => child instanceof HTMLElement,
  )
  container.dataset.vSwitchCount = String(directChildren.length)
  const base = state.sequentialClick
  for (const [i, child] of directChildren.entries()) {
    child.dataset.vSwitch = String(base + i)
  }
  const lastStep = base + Math.max(0, directChildren.length - 1)
  state.clickIndex = Math.max(state.clickIndex, lastStep)
  state.sequentialClick = Math.max(state.sequentialClick, lastStep)
  state.lastAssignedClick = lastStep
  container.removeAttribute('v-switch')
}

function applyClickDirective(element: HTMLElement, state: ClickState) {
  const isHide =
    element.hasAttribute('v-click.hide') ||
    element.hasAttribute('v-click-hide') ||
    element.dataset.vClickHideMarker === 'true'

  const rawValue =
    element.getAttribute('v-click') ??
    element.getAttribute('v-click.hide') ??
    element.getAttribute('v-click-hide')

  const parsed = parseClickValue(rawValue)

  if (parsed.kind === 'range') {
    const [start, end] = parsed.value
    element.dataset.vClick = String(start)
    element.dataset.vClickEnd = String(end)
    // Range extends the max click so the counter covers the visible window,
    // but does NOT advance the sequential allocator.
    state.clickIndex = Math.max(state.clickIndex, end - 1)
    return
  }

  if (parsed.kind === 'number') {
    // Absolute-position v-click. Subsequent auto-allocated clicks continue
    // from the max of the current sequential counter and this value.
    applyClickToElement(element, parsed.value, state)
    if (isHide) {
      element.dataset.vClickHide = 'true'
    }
    return
  }

  const step = state.sequentialClick + 1
  applyClickToElement(element, step, state)
  if (isHide) {
    element.dataset.vClickHide = 'true'
  }
}

type ParsedClickValue =
  | { kind: 'none' }
  | { kind: 'number'; value: number }
  | { kind: 'range'; value: [number, number] }

function parseClickValue(raw: string | null): ParsedClickValue {
  if (raw === null || raw === '') {
    return { kind: 'none' }
  }
  const trimmed = raw.trim()
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const inner = trimmed.slice(1, -1).trim()
    const parts = inner.split(',').map((p) => parsePositiveInt(p.trim()))
    if (parts.length === 2 && parts[0] !== null && parts[1] !== null) {
      return { kind: 'range', value: [parts[0], parts[1]] }
    }
  }
  const num = parsePositiveInt(trimmed)
  if (num !== null) {
    return { kind: 'number', value: num }
  }
  return { kind: 'none' }
}

function applyClickToElement(element: HTMLElement, click: number, state: ClickState) {
  element.dataset.vClick = String(click)
  state.clickIndex = Math.max(state.clickIndex, click)
  state.sequentialClick = Math.max(state.sequentialClick, click)
  state.lastAssignedClick = click
}

function isClickElement(element: HTMLElement) {
  return (
    element.tagName.toLowerCase() === 'v-click' ||
    element.hasAttribute('v-click') ||
    element.hasAttribute('v-click.hide') ||
    element.hasAttribute('v-click-hide')
  )
}

function isAfterElement(element: HTMLElement) {
  return element.tagName.toLowerCase() === 'v-after' || element.hasAttribute('v-after')
}

function isClicksContainer(element: HTMLElement) {
  return element.tagName.toLowerCase() === 'v-clicks' || element.hasAttribute('v-clicks')
}

function isSwitchContainer(element: HTMLElement) {
  return element.tagName.toLowerCase() === 'v-switch' || element.hasAttribute('v-switch')
}

function isMarkElement(element: HTMLElement) {
  return element.tagName.toLowerCase() === 'v-mark'
}

function countMarkClick(element: HTMLElement, state: ClickState) {
  const atValue = element.getAttribute('at')
  if (atValue === null) {
    return
  }
  const click = parsePositiveInt(atValue)
  if (click !== null) {
    state.clickIndex = Math.max(state.clickIndex, click)
  }
}

function normalizeCustomTag(element: HTMLElement) {
  const tagName = element.tagName.toLowerCase()
  if (
    tagName !== 'v-click' &&
    tagName !== 'v-after' &&
    tagName !== 'v-clicks' &&
    tagName !== 'v-switch'
  ) {
    return element
  }

  const replacement = element.ownerDocument.createElement('div')
  for (const attribute of element.attributes) {
    replacement.setAttribute(attribute.name, attribute.value)
  }
  replacement.innerHTML = element.innerHTML
  // Preserve original tag signal so downstream checks still work when the
  // source used the tag form (e.g. `<v-click>` with no matching attribute).
  const signalAttr = CLICK_DIRECTIVE_ATTR_SET.has(tagName) ? tagName : null
  if (signalAttr !== null && !replacement.hasAttribute(signalAttr)) {
    replacement.setAttribute(signalAttr, '')
  }
  element.replaceWith(replacement)
  return replacement
}
