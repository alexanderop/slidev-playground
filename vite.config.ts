import vue from '@vitejs/plugin-vue'
import Unocss from 'unocss/vite'
import { defineConfig } from 'vite-plus'
import { playwright } from 'vite-plus/test/browser-playwright'

export default defineConfig({
  plugins: [vue(), Unocss()],
  server: {
    port: 5174,
  },
  resolve: {
    alias: {
      vue: 'vue/dist/vue.esm-bundler.js',
    },
  },
  optimizeDeps: {
    include: [
      '@codemirror/commands',
      '@codemirror/lang-markdown',
      '@codemirror/language-data',
      '@codemirror/state',
      '@codemirror/theme-one-dark',
      '@codemirror/view',
      '@shikijs/engine-javascript',
      '@shikijs/markdown-it/core',
      '@slidev/parser',
      'markdown-it',
      'shiki',
    ],
  },

  run: {
    cache: {
      scripts: true,
      tasks: true,
    },
    tasks: {
      'ci:check': {
        command: 'vp run check',
        input: [{ auto: true }, '!dist/**', '!coverage/**', '!.vitest-attachments/**'],
      },
      'ci:test': {
        command: 'vp test',
        dependsOn: ['ci:check'],
        input: [{ auto: true }, '!dist/**', '!coverage/**', '!.vitest-attachments/**'],
      },
      'ci:build': {
        command: 'vp build',
        dependsOn: ['ci:check'],
        env: ['NODE_ENV', 'VITE_*'],
        input: [{ auto: true }, '!dist/**', '!coverage/**', '!.vitest-attachments/**'],
      },
      ci: {
        command: 'echo "CI passed"',
        dependsOn: ['ci:check', 'ci:test', 'ci:build'],
        env: ['NODE_ENV', 'VITE_*'],
        untrackedEnv: ['CI', 'GITHUB_ACTIONS'],
      },
    },
  },

  lint: {
    jsPlugins: ['./src/lint/feature-boundaries.js', './src/lint/no-else.js'],
    options: {
      typeAware: true,
      typeCheck: true,
    },
    overrides: [
      {
        files: ['src/lint/**/*.js'],
        rules: {
          'typescript/no-unsafe-assignment': 'off',
          'typescript/no-unsafe-member-access': 'off',
          'typescript/no-unsafe-call': 'off',
          'typescript/no-unsafe-return': 'off',
          'typescript/no-unsafe-argument': 'off',
        },
      },
    ],
    categories: {
      correctness: 'error',
      suspicious: 'warn',
      pedantic: 'warn',
      perf: 'warn',
    },
    plugins: ['typescript', 'unicorn', 'import', 'promise', 'vue', 'oxc'],
    rules: {
      // Correctness & safety
      eqeqeq: 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-else-return': ['error', { allowElseIf: false }],
      'prefer-const': 'error',
      curly: 'error',

      // TypeScript strictness
      'typescript/no-explicit-any': 'warn',
      'typescript/no-unsafe-assignment': 'warn',
      'typescript/no-unsafe-member-access': 'warn',
      'typescript/no-unsafe-call': 'warn',
      'typescript/no-unsafe-return': 'warn',
      'typescript/no-unsafe-argument': 'warn',
      'typescript/no-misused-promises': 'error',
      'typescript/consistent-type-imports': 'error',
      'typescript/no-import-type-side-effects': 'error',
      'typescript/prefer-nullish-coalescing': 'warn',
      'typescript/switch-exhaustiveness-check': 'warn',
      'typescript/no-deprecated': 'warn',
      'typescript/ban-ts-comment': 'warn',
      'typescript/return-await': 'warn',

      // Import hygiene
      'import/no-cycle': 'error',
      'import/no-self-import': 'error',
      'import/no-duplicates': 'error',

      // Promise safety
      'promise/no-multiple-resolved': 'error',
      'promise/catch-or-return': 'warn',

      // Modern JS (unicorn)
      'unicorn/prefer-array-flat-map': 'warn',
      'unicorn/prefer-array-some': 'warn',
      'unicorn/prefer-at': 'warn',
      'unicorn/prefer-string-replace-all': 'warn',
      'unicorn/prefer-string-slice': 'warn',
      'unicorn/prefer-regexp-test': 'warn',
      'unicorn/prefer-date-now': 'warn',
      'unicorn/prefer-dom-node-append': 'warn',
      'unicorn/prefer-dom-node-remove': 'warn',
      'unicorn/prefer-query-selector': 'warn',
      'unicorn/prefer-event-target': 'warn',
      'unicorn/no-useless-promise-resolve-reject': 'error',
      'unicorn/no-useless-undefined': 'warn',
      'unicorn/consistent-function-scoping': 'warn',
      'unicorn/no-instanceof-array': 'error',

      // Vue (all available native oxlint rules)
      'vue/no-arrow-functions-in-watch': 'error',
      'vue/no-deprecated-destroyed-lifecycle': 'error',
      'vue/no-export-in-script-setup': 'error',
      'vue/no-lifecycle-after-await': 'error',
      'vue/no-this-in-before-route-enter': 'error',
      'vue/prefer-import-from-vue': 'warn',
      'vue/valid-define-props': 'error',
      'vue/valid-define-emits': 'error',
      'vue/no-required-prop-with-default': 'warn',
      'vue/require-default-export': 'error',
      'vue/no-import-compiler-macros': 'warn',
      'vue/no-multiple-slot-args': 'error',
      'vue/max-props': ['warn', { maxProps: 8 }],

      // Feature boundaries (custom JS plugin)
      'boundaries/no-cross-feature-import': 'error',
      'boundaries/unidirectional-flow': 'error',

      // Style (custom JS plugin)
      'style/no-else': 'error',

      // Pedantic but useful — turn off noisy ones
      'max-lines-per-function': 'off',
      'max-lines': 'off',
      'max-depth': 'off',
      'max-nested-callbacks': 'off',
      'unicorn/no-array-callback-reference': 'off',
      'import/no-unassigned-import': 'off',
      'import/max-dependencies': 'off',
      'unicorn/prefer-top-level-await': 'off',
      'oxc/no-map-spread': 'off',
      'no-ternary': 'off',
    },
  },

  fmt: {
    singleQuote: true,
    semi: false,
    sortPackageJson: true,
  },

  test: {
    include: ['src/**/*.browser.test.ts'],
    globals: true,
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: 'chromium' }],
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,vue}'],
      exclude: ['src/**/*.browser.test.ts', 'src/**/*.d.ts', 'src/main.ts'],
    },
  },

  staged: {
    '*.{ts,tsx}': 'vp check --fix',
    '*.vue': 'vp check --fix && vp exec eslint',
  },
})
