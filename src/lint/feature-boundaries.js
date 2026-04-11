import { resolve, dirname, relative, sep, posix } from 'node:path'

/**
 * Resolve a relative import specifier to an absolute path,
 * then convert it to a posix-style path relative to the src/ root.
 *
 * @param {string} importSource - The import specifier (e.g. '../../config/constants')
 * @param {string} filename - Absolute path of the importing file
 * @param {string} cwd - Project root (cwd from context)
 * @returns {string | null} Posix path relative to src/, or null for non-relative imports
 */
function resolveToSrcRelative(importSource, filename, cwd) {
  if (!importSource.startsWith('.')) {
    return null
  }

  const abs = resolve(dirname(filename), importSource)
  const fromSrc = relative(resolve(cwd, 'src'), abs)

  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (fromSrc.startsWith('..')) {
    return null
  }

  return fromSrc.split(sep).join(posix.sep)
}

/**
 * Extract the layer a file belongs to from its src-relative path.
 *
 * Layers (in dependency order):
 *   shared  — types/, utils/, config/, styles/, composables/, components/, lint/
 *   feature — features/<name>/...
 *   app     — app/...
 *
 * @param {string} srcRelPath - Posix path relative to src/
 * @returns {{ layer: 'shared' | 'feature' | 'app' | 'test', featureName?: string }}
 */
function classifyPath(srcRelPath) {
  if (srcRelPath.startsWith('app/')) {
    return { layer: 'app' }
  }

  const featureMatch = srcRelPath.match(/^features\/([^/]+)/)
  if (featureMatch) {
    return { layer: 'feature', featureName: featureMatch[1] }
  }

  if (
    srcRelPath.startsWith('test-utils/') ||
    srcRelPath.startsWith('test-fixtures/') ||
    srcRelPath.endsWith('.test.ts') ||
    srcRelPath.endsWith('.browser.test.ts')
  ) {
    return { layer: 'test' }
  }

  return { layer: 'shared' }
}

/** @type {import('oxlint/plugins-dev').Rule} */
const noCrossFeatureImport = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow direct imports between feature modules',
    },
    messages: {
      crossFeature:
        'Feature "{{from}}" must not import from feature "{{to}}". Compose features at the app level instead.',
    },
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        const source = node.source.value
        const resolved = resolveToSrcRelative(source, context.filename, context.cwd)
        if (resolved === null || resolved === undefined || resolved === '') {
          return
        }

        const current = classifyPath(
          relative(resolve(context.cwd, 'src'), context.filename).split(sep).join(posix.sep),
        )
        const target = classifyPath(resolved)

        if (
          current.layer === 'feature' &&
          target.layer === 'feature' &&
          current.featureName !== target.featureName
        ) {
          context.report({
            node: node.source,
            messageId: 'crossFeature',
            data: {
              from: current.featureName,
              to: target.featureName,
            },
          })
        }
      },
    }
  },
}

/** @type {import('oxlint/plugins-dev').Rule} */
const unidirectionalFlow = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce unidirectional dependency flow: shared -> features -> app',
    },
    messages: {
      sharedImportsFeature:
        'Shared module "{{layer}}" must not import from "{{target}}". Dependency flow: shared -> features -> app.',
      sharedImportsApp:
        'Shared module "{{layer}}" must not import from app layer. Dependency flow: shared -> features -> app.',
      featureImportsApp:
        'Feature "{{feature}}" must not import from app layer. Dependency flow: shared -> features -> app.',
    },
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        const source = node.source.value
        const resolved = resolveToSrcRelative(source, context.filename, context.cwd)
        if (resolved === null || resolved === undefined || resolved === '') {
          return
        }

        const currentRel = relative(resolve(context.cwd, 'src'), context.filename)
          .split(sep)
          .join(posix.sep)
        const current = classifyPath(currentRel)
        const target = classifyPath(resolved)

        if (current.layer === 'test') {
          return
        }

        if (current.layer === 'shared') {
          if (target.layer === 'feature') {
            const folder = currentRel.split('/')[0]
            context.report({
              node: node.source,
              messageId: 'sharedImportsFeature',
              data: { layer: folder, target: `features/${target.featureName}` },
            })
          }
          if (target.layer === 'app') {
            const folder = currentRel.split('/')[0]
            context.report({
              node: node.source,
              messageId: 'sharedImportsApp',
              data: { layer: folder },
            })
          }
        }

        if (current.layer === 'feature' && target.layer === 'app') {
          context.report({
            node: node.source,
            messageId: 'featureImportsApp',
            data: { feature: current.featureName },
          })
        }
      },
    }
  },
}

/** @type {import('oxlint/plugins-dev').default} */
export default {
  meta: { name: 'boundaries' },
  rules: {
    'no-cross-feature-import': noCrossFeatureImport,
    'unidirectional-flow': unidirectionalFlow,
  },
}
