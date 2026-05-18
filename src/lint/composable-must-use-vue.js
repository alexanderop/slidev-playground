import path from 'node:path'

const VALID_VUE_SOURCES = new Set(['vue', '@vueuse/core'])

function isComposableFilename(filename) {
  const base = path.basename(filename, path.extname(filename))
  return /^use[A-Z]/.test(base)
}

/** @type {import('oxlint/plugins-dev').Rule} */
const mustUseVue = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Composable files (use*.ts) must import from vue or @vueuse/core. If they do not, they are utilities — rename or move them.',
    },
    messages: {
      notAComposable:
        'File "{{filename}}" is named like a composable but does not import from vue or @vueuse/core. Move it to utils/ or add Vue reactivity.',
    },
  },
  create(context) {
    if (!isComposableFilename(context.filename)) {
      return {}
    }

    let hasVueImport = false

    return {
      ImportDeclaration(node) {
        if (typeof node.source.value === 'string' && VALID_VUE_SOURCES.has(node.source.value)) {
          hasVueImport = true
        }
      },
      'Program:exit'(node) {
        if (hasVueImport) {
          return
        }

        context.report({
          node,
          messageId: 'notAComposable',
          data: { filename: path.basename(context.filename) },
        })
      },
    }
  },
}

/** @type {import('oxlint/plugins-dev').default} */
export default {
  meta: { name: 'composables' },
  rules: {
    'must-use-vue': mustUseVue,
  },
}
