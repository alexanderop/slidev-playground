import type { Ref } from 'vue'
import { completionKeymap } from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { EditorState } from '@codemirror/state'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView, keymap, lineNumbers } from '@codemirror/view'
import { onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'
import { slideBoundaries } from './slideBoundaries'
import { slidevAutocompletion } from './slidevAutocompletion'

export function useCodeMirror(
  container: Ref<HTMLElement | null>,
  doc: Ref<string>,
  onChange: (value: string) => void,
) {
  const view = shallowRef<EditorView | null>(null)
  let ignoreNextUpdate = false

  function setContent(value: string) {
    if (!view.value) {
      return
    }
    const current = view.value.state.doc.toString()
    if (current === value) {
      return
    }
    view.value.dispatch({
      changes: { from: 0, to: current.length, insert: value },
    })
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
        lineNumbers(),
        history(),
        keymap.of([...completionKeymap, ...defaultKeymap, ...historyKeymap]),
        markdown({ codeLanguages: languages }),
        slidevAutocompletion,
        oneDark,
        EditorView.contentAttributes.of({
          'aria-label': 'Slide markdown editor',
        }),
        ...slideBoundaries,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            ignoreNextUpdate = true
            onChange(update.state.doc.toString())
          }
        }),
      ],
    })
    view.value = new EditorView({ state, parent: container.value })
  })

  onBeforeUnmount(() => {
    view.value?.destroy()
    view.value = null
  })

  watch(doc, (newVal) => {
    if (ignoreNextUpdate) {
      ignoreNextUpdate = false
      return
    }
    setContent(newVal)
  })

  return { view, setContent, getContent }
}
