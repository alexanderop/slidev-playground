/** @type {import('oxlint/plugins-dev').Rule} */
const noTryCatch = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow try/catch — prefer a Result-style helper that returns [error, data], or let the error propagate.',
    },
    messages: {
      noTryCatch:
        'Avoid try/catch. Prefer a Result-style helper that returns [error, data], or let the error propagate.',
    },
  },
  create(context) {
    return {
      TryStatement(node) {
        context.report({
          node,
          messageId: 'noTryCatch',
        })
      },
    }
  },
}

/** @type {import('oxlint/plugins-dev').default} */
export default {
  meta: { name: 'errors' },
  rules: {
    'no-try-catch': noTryCatch,
  },
}
