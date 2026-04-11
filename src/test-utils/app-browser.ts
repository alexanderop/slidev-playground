import { EditorView } from '@codemirror/view'
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import { render } from 'vitest-browser-vue'
import { nextTick } from 'vue'
import App from '../app/App.vue'
import { _resetThemeForTesting } from '../composables/useTheme'
import { clearComponentCache } from '../features/slides/render'
import '../styles'

export interface RenderAppOptions {
  hash?: string
  markdown?: string
  componentFiles?: Record<string, string>
  nativeShare?: boolean
}

export interface RenderedApp {
  alertSpy: ReturnType<typeof vi.fn>
  clipboardSpy: ReturnType<typeof vi.fn>
  execCommandSpy: ReturnType<typeof vi.fn>
  exitFullscreenSpy: ReturnType<typeof vi.fn>
  requestFullscreenSpy: ReturnType<typeof vi.fn>
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

export function decodePlaygroundState(hash: string): {
  markdown: string
  componentFiles: Record<string, string>
} {
  const raw = decompressFromEncodedURIComponent(hash) ?? ''
  if (raw.startsWith('{')) {
    try {
      const parsed: unknown = JSON.parse(raw)
      if (typeof parsed === 'object' && parsed !== null) {
        const obj = parsed as Record<string, unknown>
        const markdown = typeof obj.m === 'string' ? obj.m : ''
        const componentFiles =
          typeof obj.c === 'object' && obj.c !== null && !Array.isArray(obj.c)
            ? (obj.c as Record<string, string>)
            : {}
        return { markdown, componentFiles }
      }
      return { markdown: raw, componentFiles: {} }
    } catch {
      return { markdown: raw, componentFiles: {} }
    }
  }
  return { markdown: raw, componentFiles: {} }
}

export async function settleApp() {
  await nextTick()
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, 0)
  })
}

export async function pressKey(
  key: string,
  options: { code?: string; shiftKey?: boolean; repeat?: boolean } = {},
) {
  const { code, shiftKey = false, repeat = false } = options
  const target = document.activeElement instanceof HTMLElement ? document.activeElement : window
  target.dispatchEvent(new KeyboardEvent('keydown', { key, code, shiftKey, repeat, bubbles: true }))
  await settleApp()
  target.dispatchEvent(new KeyboardEvent('keyup', { key, code, shiftKey, bubbles: true }))
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

function buildEncodedHash(
  hash: string | undefined,
  markdown: string | undefined,
  componentFiles: Record<string, string> | undefined,
) {
  if (hash !== undefined) {
    return hash
  }

  if (markdown === undefined) {
    return ''
  }

  if (componentFiles && Object.keys(componentFiles).length > 0) {
    return compressToEncodedURIComponent(JSON.stringify({ m: markdown, c: componentFiles }))
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
  property: 'execCommand' | 'fullscreenElement' | 'exitFullscreen',
  descriptor: PropertyDescriptor | undefined,
) {
  if (descriptor) {
    Object.defineProperty(document, property, descriptor)
    return
  }

  Reflect.deleteProperty(document, property)
}

export function renderApp(options: RenderAppOptions = {}): RenderedApp {
  const { hash, markdown, componentFiles, nativeShare = false } = options

  _resetThemeForTesting()
  resetRootStyles()
  clearComponentCache()

  const encodedHash = buildEncodedHash(hash, markdown, componentFiles)
  window.history.replaceState(
    null,
    '',
    `${window.location.pathname}${encodedHash ? `#${encodedHash}` : ''}`,
  )

  const shareSpy = vi.fn(() => Promise.resolve())
  const canShareSpy = vi.fn(() => nativeShare)
  const clipboardSpy = vi.fn(() => Promise.resolve())
  const execCommandSpy = vi.fn(() => true)
  const alertSpy = vi.fn()
  const requestFullscreenSpy = vi.fn(function (this: Element) {
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      value: this,
      writable: true,
    })
    return Promise.resolve()
  })
  const exitFullscreenSpy = vi.fn(() => {
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      value: null,
      writable: true,
    })
    return Promise.resolve()
  })
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
  const originalAlert = Object.getOwnPropertyDescriptor(window, 'alert')
  const originalFullscreenElement = Object.getOwnPropertyDescriptor(document, 'fullscreenElement')
  const originalExitFullscreen = Object.getOwnPropertyDescriptor(document, 'exitFullscreen')
  const originalRequestFullscreen = Object.getOwnPropertyDescriptor(
    Element.prototype,
    'requestFullscreen',
  )

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
  Object.defineProperty(window, 'alert', {
    configurable: true,
    value: alertSpy,
  })
  Object.defineProperty(document, 'fullscreenElement', {
    configurable: true,
    value: null,
    writable: true,
  })
  Object.defineProperty(document, 'exitFullscreen', {
    configurable: true,
    value: exitFullscreenSpy,
  })
  Object.defineProperty(Element.prototype, 'requestFullscreen', {
    configurable: true,
    value: requestFullscreenSpy,
  })

  const screen = render(App)

  return {
    screen,
    alertSpy,
    shareSpy,
    clipboardSpy,
    execCommandSpy,
    requestFullscreenSpy,
    exitFullscreenSpy,
    [Symbol.dispose]: () => {
      void screen.unmount()
      document.body.innerHTML = ''
      restoreOrDeleteNavigatorProperty('share', originalShare)
      restoreOrDeleteNavigatorProperty('canShare', originalCanShare)
      restoreOrDeleteNavigatorProperty('clipboard', originalClipboard)
      restoreOrDeleteNavigatorProperty('permissions', originalPermissions)
      restoreOrDeleteDocumentProperty('execCommand', originalExecCommand)
      restoreOrDeleteDocumentProperty('fullscreenElement', originalFullscreenElement)
      restoreOrDeleteDocumentProperty('exitFullscreen', originalExitFullscreen)
      if (originalAlert) {
        Object.defineProperty(window, 'alert', originalAlert)
      }
      if (!originalAlert) {
        Reflect.deleteProperty(window, 'alert')
      }
      if (originalRequestFullscreen) {
        Object.defineProperty(Element.prototype, 'requestFullscreen', originalRequestFullscreen)
      }
      if (!originalRequestFullscreen) {
        Reflect.deleteProperty(Element.prototype, 'requestFullscreen')
      }
      window.history.replaceState(null, '', window.location.pathname)
      resetRootStyles()
      _resetThemeForTesting()
      clearComponentCache()
      document.querySelector('#slidev-custom-component-styles')?.remove()
    },
  }
}
