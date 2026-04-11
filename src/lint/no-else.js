/** @type {import('oxlint/plugins-dev').Rule} */
const noElse = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow else blocks — use early returns, ternaries, or guard clauses instead',
    },
    messages: {
      noElse: 'Unexpected `else` — use an early return or guard clause instead.',
    },
  },
  create(context) {
    return {
      IfStatement(node) {
        if (node.alternate !== null && node.alternate !== undefined) {
          context.report({
            node: node.alternate,
            messageId: 'noElse',
          })
        }
      },
    }
  },
}

/** @type {import('oxlint/plugins-dev').default} */
export default {
  meta: { name: 'style' },
  rules: {
    'no-else': noElse,
  },
}
