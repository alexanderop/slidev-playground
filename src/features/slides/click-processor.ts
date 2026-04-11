export interface ClickResult {
  html: string
  totalClicks: number
}

export function processClicks(html: string): ClickResult {
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html')
  const container = doc.body.firstElementChild!
  const state = {
    clickIndex: 0,
    lastAssignedClick: 0,
  }

  processNode(container, state)

  return {
    html: container.innerHTML,
    totalClicks: state.clickIndex,
  }
}

function processNode(
  node: Node,
  state: {
    clickIndex: number
    lastAssignedClick: number
  },
) {
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

    if (isClicksContainer(normalizedChild)) {
      processClicksContainer(normalizedChild, state)
      normalizedChild.removeAttribute('v-clicks')
      continue
    }

    if (isClickElement(normalizedChild)) {
      applyClickToElement(normalizedChild, state.clickIndex + 1, state)
      normalizedChild.removeAttribute('v-click')
    }
    if (!isClickElement(normalizedChild) && isAfterElement(normalizedChild)) {
      applyClickToElement(normalizedChild, Math.max(1, state.lastAssignedClick), state)
      normalizedChild.removeAttribute('v-after')
    }

    processNode(normalizedChild, state)
  }
}

function processLegacyClickComment(
  node: ChildNode,
  state: {
    clickIndex: number
    lastAssignedClick: number
  },
) {
  if (node.textContent?.trim() !== 'v-click') {
    return
  }

  let sibling = node.nextSibling
  while (sibling && sibling.nodeType !== Node.ELEMENT_NODE) {
    sibling = sibling.nextSibling
  }

  if (sibling instanceof HTMLElement) {
    applyClickToElement(sibling, state.clickIndex + 1, state)
  }

  node.remove()
}

function processClicksContainer(
  container: HTMLElement,
  state: {
    clickIndex: number
    lastAssignedClick: number
  },
) {
  const directChildren = [...container.children]
  for (const child of directChildren) {
    if (!(child instanceof HTMLElement)) {
      continue
    }
    applyClickToElement(child, state.clickIndex + 1, state)
  }
}

function applyClickToElement(
  element: HTMLElement,
  click: number,
  state: {
    clickIndex: number
    lastAssignedClick: number
  },
) {
  element.dataset.vClick = String(click)
  state.clickIndex = Math.max(state.clickIndex, click)
  state.lastAssignedClick = click
}

function isClickElement(element: HTMLElement) {
  return element.tagName.toLowerCase() === 'v-click' || element.hasAttribute('v-click')
}

function isAfterElement(element: HTMLElement) {
  return element.tagName.toLowerCase() === 'v-after' || element.hasAttribute('v-after')
}

function isClicksContainer(element: HTMLElement) {
  return element.tagName.toLowerCase() === 'v-clicks' || element.hasAttribute('v-clicks')
}

function normalizeCustomTag(element: HTMLElement) {
  const tagName = element.tagName.toLowerCase()
  if (tagName !== 'v-click' && tagName !== 'v-after' && tagName !== 'v-clicks') {
    return element
  }

  const replacement = element.ownerDocument.createElement('div')
  for (const attribute of element.attributes) {
    replacement.setAttribute(attribute.name, attribute.value)
  }
  replacement.innerHTML = element.innerHTML
  element.replaceWith(replacement)
  return replacement
}
