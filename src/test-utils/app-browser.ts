import { EditorView } from '@codemirror/view'
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import { render } from 'vitest-browser-vue'
import { nextTick } from 'vue'
import App from '../App.vue'
import { _resetThemeForTesting } from '../composables/useTheme'
import '../styles'

export interface RenderAppOptions {
  hash?: string
  markdown?: string
  nativeShare?: boolean
}

export interface RenderedApp {
  clipboardSpy: ReturnType<typeof vi.fn>
  execCommandSpy: ReturnType<typeof vi.fn>
  screen: ReturnType<typeof render>
  shareSpy: ReturnType<typeof vi.fn>
  [Symbol.dispose](): void
}

function resetRootStyles() {
  const root = document.documentElement
  root.classList.remove('dark')
  for (const property of Array.from(root.style)) {
    if (property.startsWith('--slidev-')) {
      root.style.removeProperty(property)
    }
  }
}

export function encodeDeck(markdown: string) {
  return compressToEncodedURIComponent(markdown)
}

export function decodeDeck(hash: string) {
  return decompressFromEncodedURIComponent(hash) ?? ''
}

export async function settleApp() {
  await nextTick()
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, 0)
  })
}

export async function pressKey(key: string) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
  await settleApp()
  window.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }))
  await settleApp()
}

export async function setMarkdown(screen: ReturnType<typeof render>, markdown: string) {
  const view = getEditorView(screen)
  const current = view.state.doc.toString()
  view.dispatch({
    changes: { from: 0, to: current.length, insert: markdown },
  })
  await settleApp()
}

export function getMarkdown(screen: ReturnType<typeof render>) {
  return getEditorView(screen).state.doc.toString()
}

function getEditorView(screen: ReturnType<typeof render>) {
  const editorRoot = screen.container.querySelector('.cm-editor')
  if (!(editorRoot instanceof HTMLElement)) {
    throw new Error('Expected CodeMirror editor root to exist')
  }

  const view = EditorView.findFromDOM(editorRoot)
  if (!view) {
    throw new Error('Expected CodeMirror EditorView to be attached to the DOM')
  }
  return view
}

function buildEncodedHash(hash: string | undefined, markdown: string | undefined) {
  if (hash !== undefined) {
    return hash
  }

  if (markdown === undefined) {
    return ''
  }

  return encodeDeck(markdown)
}

function deleteNavigatorProperty(property: 'share' | 'canShare' | 'clipboard' | 'permissions') {
  Reflect.deleteProperty(navigator, property)
}

function restoreOrDeleteNavigatorProperty(
  property: 'share' | 'canShare' | 'clipboard' | 'permissions',
  descriptor: PropertyDescriptor | undefined,
) {
  if (descriptor) {
    Object.defineProperty(navigator, property, descriptor)
    return
  }

  deleteNavigatorProperty(property)
}

function restoreOrDeleteDocumentProperty(
  property: 'execCommand',
  descriptor: PropertyDescriptor | undefined,
) {
  if (descriptor) {
    Object.defineProperty(document, property, descriptor)
    return
  }

  Reflect.deleteProperty(document, property)
}

export function renderApp(options: RenderAppOptions = {}): RenderedApp {
  const { hash, markdown, nativeShare = false } = options

  _resetThemeForTesting()
  resetRootStyles()

  const encodedHash = buildEncodedHash(hash, markdown)
  window.history.replaceState(
    null,
    '',
    `${window.location.pathname}${encodedHash ? `#${encodedHash}` : ''}`,
  )

  const shareSpy = vi.fn(() => Promise.resolve())
  const canShareSpy = vi.fn(() => nativeShare)
  const clipboardSpy = vi.fn(() => Promise.resolve())
  const execCommandSpy = vi.fn(() => true)
  const permissionsStatus = {
    state: 'granted',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }
  const permissionsSpy = vi.fn(() => Promise.resolve(permissionsStatus))

  const originalShare = Object.getOwnPropertyDescriptor(navigator, 'share')
  const originalCanShare = Object.getOwnPropertyDescriptor(navigator, 'canShare')
  const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
  const originalPermissions = Object.getOwnPropertyDescriptor(navigator, 'permissions')
  const originalExecCommand = Object.getOwnPropertyDescriptor(document, 'execCommand')

  Object.defineProperty(navigator, 'share', {
    configurable: true,
    value: nativeShare ? shareSpy : undefined,
  })
  Object.defineProperty(navigator, 'canShare', {
    configurable: true,
    value: nativeShare ? canShareSpy : undefined,
  })
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: clipboardSpy },
  })
  Object.defineProperty(navigator, 'permissions', {
    configurable: true,
    value: { query: permissionsSpy },
  })
  Object.defineProperty(document, 'execCommand', {
    configurable: true,
    value: execCommandSpy,
  })

  const screen = render(App)

  return {
    screen,
    shareSpy,
    clipboardSpy,
    execCommandSpy,
    [Symbol.dispose]: () => {
      void screen.unmount()
      restoreOrDeleteNavigatorProperty('share', originalShare)
      restoreOrDeleteNavigatorProperty('canShare', originalCanShare)
      restoreOrDeleteNavigatorProperty('clipboard', originalClipboard)
      restoreOrDeleteNavigatorProperty('permissions', originalPermissions)
      restoreOrDeleteDocumentProperty('execCommand', originalExecCommand)
      window.history.replaceState(null, '', window.location.pathname)
      resetRootStyles()
      _resetThemeForTesting()
    },
  }
}
