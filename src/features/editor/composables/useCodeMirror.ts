import type { Ref } from 'vue'
import type * as VimModule from '@replit/codemirror-vim'
import { closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { codeFolding, foldGutter, foldKeymap } from '@codemirror/language'
import { languages } from '@codemirror/language-data'
import { search, searchKeymap } from '@codemirror/search'
import { Compartment, EditorState } from '@codemirror/state'
import { oneDark } from '@codemirror/theme-one-dark'
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from '@codemirror/view'
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { slideBoundaries } from './slideBoundaries'
import { slidevAutocompletion } from './slidevAutocompletion'

export type VimMode = 'normal' | 'insert' | 'visual' | 'replace'

export function useCodeMirror(
  container: Ref<HTMLElement | null>,
  doc: Ref<string>,
  onChange: (value: string) => void,
) {
  const view = shallowRef<EditorView | null>(null)
  const vimEnabled = ref(false)
  const vimMode = ref<VimMode>('normal')
  const vimCompartment = new Compartment()
  let isApplyingExternal = false
  let detachModeListener: (() => void) | null = null
  let vimModule: typeof VimModule | null = null

  function attachModeListener() {
    if (!view.value || !vimModule || detachModeListener) {
      return
    }
    const cm = vimModule.getCM(view.value)
    if (!cm) {
      return
    }
    const handler = (e: { mode: VimMode }) => {
      vimMode.value = e.mode
    }
    cm.on('vim-mode-change', handler)
    detachModeListener = () => {
      cm.off('vim-mode-change', handler)
      detachModeListener = null
    }
  }

  async function toggleVim() {
    const current = view.value
    if (!current) {
      return
    }
    if (vimEnabled.value) {
      vimEnabled.value = false
      current.dispatch({ effects: vimCompartment.reconfigure([]) })
      detachModeListener?.()
      vimMode.value = 'normal'
      current.focus()
      return
    }
    vimModule ??= await import('@replit/codemirror-vim')
    const stillMounted = view.value
    if (!stillMounted) {
      return
    }
    vimEnabled.value = true
    stillMounted.dispatch({ effects: vimCompartment.reconfigure(vimModule.vim()) })
    vimMode.value = 'normal'
    attachModeListener()
    stillMounted.focus()
  }

  function setContent(value: string) {
    if (!view.value) {
      return
    }
    const current = view.value.state.doc.toString()
    if (current === value) {
      return
    }
    isApplyingExternal = true
    view.value.dispatch({
      changes: { from: 0, to: current.length, insert: value },
    })
    isApplyingExternal = false
  }

  function getContent(): string {
    return view.value?.state.doc.toString() ?? ''
  }

  onMounted(() => {
    if (!container.value) {
      return
    }
    const state = EditorState.create({
      doc: doc.value,
      extensions: [
        // Vim must come before the rest so its keymap wins when enabled.
        vimCompartment.of([]),
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        drawSelection(),
        history(),
        closeBrackets(),
        codeFolding(),
        foldGutter(),
        search({ top: true }),
        EditorView.lineWrapping,
        keymap.of([
          ...closeBracketsKeymap,
          ...completionKeymap,
          ...defaultKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...searchKeymap,
          indentWithTab,
        ]),
        markdown({ codeLanguages: languages }),
        slidevAutocompletion,
        oneDark,
        EditorView.contentAttributes.of({
          'aria-label': 'Slide markdown editor',
        }),
        ...slideBoundaries,
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !isApplyingExternal) {
            onChange(update.state.doc.toString())
          }
        }),
      ],
    })
    view.value = new EditorView({ state, parent: container.value })
  })

  onBeforeUnmount(() => {
    detachModeListener?.()
    view.value?.destroy()
    view.value = null
  })

  watch(doc, (newVal) => {
    setContent(newVal)
  })

  return { view, setContent, getContent, vimEnabled, vimMode, toggleVim }
}
