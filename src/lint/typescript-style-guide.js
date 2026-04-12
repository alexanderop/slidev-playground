function isDisallowedGenericName(name) {
  return /^[TKUV]$/.test(name) || !/^T[A-Z]/.test(name)
}

function getLiteralValue(node) {
  if (typeof node.value === 'string') {
    return node.value
  }

  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
    return node.quasis[0]?.value.cooked ?? null
  }

  return null
}

/** @type {import('oxlint/plugins-dev').Rule} */
const noEnum = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow TypeScript enums in favor of unions and const assertions',
    },
    messages: {
      noEnum:
        'Unexpected enum "{{name}}". Use a union type, an `as const` array, or an `as const` object instead.',
    },
  },
  create(context) {
    return {
      TSEnumDeclaration(node) {
        context.report({
          node: node.id,
          messageId: 'noEnum',
          data: { name: node.id.name },
        })
      },
    }
  },
}

/** @type {import('oxlint/plugins-dev').Rule} */
const noDefaultExport = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow default exports in source files',
    },
    messages: {
      noDefaultExport: 'Unexpected default export. Use a named export instead.',
    },
  },
  create(context) {
    return {
      ExportDefaultDeclaration(node) {
        context.report({
          node,
          messageId: 'noDefaultExport',
        })
      },
    }
  },
}

/** @type {import('oxlint/plugins-dev').Rule} */
const genericTypeParameterNames = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require descriptive generic names that start with T',
    },
    messages: {
      genericTypeParameterNames:
        'Generic type parameter "{{name}}" must start with `T` and use a descriptive name such as `TItem`.',
    },
  },
  create(context) {
    function checkTypeParameters(typeParameters) {
      for (const param of typeParameters?.params ?? []) {
        const name = param.name?.name
        if (name === undefined || !isDisallowedGenericName(name)) {
          continue
        }

        context.report({
          node: param.name,
          messageId: 'genericTypeParameterNames',
          data: { name },
        })
      }
    }

    return {
      ArrowFunctionExpression(node) {
        checkTypeParameters(node.typeParameters)
      },
      ClassDeclaration(node) {
        checkTypeParameters(node.typeParameters)
      },
      ClassExpression(node) {
        checkTypeParameters(node.typeParameters)
      },
      FunctionDeclaration(node) {
        checkTypeParameters(node.typeParameters)
      },
      FunctionExpression(node) {
        checkTypeParameters(node.typeParameters)
      },
      TSInterfaceDeclaration(node) {
        checkTypeParameters(node.typeParameters)
      },
      TSTypeAliasDeclaration(node) {
        checkTypeParameters(node.typeParameters)
      },
    }
  },
}

/** @type {import('oxlint/plugins-dev').Rule} */
const noNonNullAssertion = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow TypeScript non-null assertions',
    },
    messages: {
      noNonNullAssertion:
        'Unexpected non-null assertion. Narrow the value with a guard instead of using `!`.',
    },
  },
  create(context) {
    return {
      TSNonNullExpression(node) {
        context.report({
          node,
          messageId: 'noNonNullAssertion',
        })
      },
    }
  },
}

/** @type {import('oxlint/plugins-dev').Rule} */
const testNameShouldWhen = {
  meta: {
    type: 'suggestion',
    docs: {
      description: "Require browser test names to use the 'should ... when ...' pattern",
    },
    messages: {
      testNameShouldWhen:
        "Test descriptions must follow `it('should ... when ...')` or `test('should ... when ...')`.",
    },
  },
  create(context) {
    const isBrowserTest = context.filename.endsWith('.browser.test.ts')

    if (isBrowserTest !== true) {
      return {}
    }

    return {
      CallExpression(node) {
        if (node.callee.type !== 'Identifier') {
          return
        }

        const calleeName = node.callee.name
        if (calleeName !== 'it' && calleeName !== 'test') {
          return
        }

        const titleNode = node.arguments[0]
        if (titleNode === undefined) {
          return
        }

        const title = getLiteralValue(titleNode)
        if (title === null) {
          return
        }

        if (/^should .+ when .+/u.test(title)) {
          return
        }

        context.report({
          node: titleNode,
          messageId: 'testNameShouldWhen',
        })
      },
    }
  },
}

/** @type {import('oxlint/plugins-dev').default} */
export default {
  meta: { name: 'ts-style' },
  rules: {
    'generic-type-parameter-names': genericTypeParameterNames,
    'no-default-export': noDefaultExport,
    'no-enum': noEnum,
    'no-non-null-assertion': noNonNullAssertion,
    'test-name-should-when': testNameShouldWhen,
  },
}
