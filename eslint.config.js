import oxlint from 'eslint-plugin-oxlint'
import pluginVue from 'eslint-plugin-vue'

// ESLint is used ONLY for template-aware Vue rules that oxlint cannot handle yet.
// All JS/TS linting is done by oxlint via `vp lint`.
// Once oxlint gains full Vue template parsing (Q2 2026 milestone), this file can be removed.

export default [
  // Vue recommended preset (includes essential + strongly-recommended + recommended)
  ...pluginVue.configs['flat/recommended'],

  // Vue-specific rules and overrides
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: '@typescript-eslint/parser',
      },
    },
    rules: {
      // ──────────────────────────────────────────────
      // Template-aware rules (the reason ESLint exists here)
      // ──────────────────────────────────────────────

      // Essential — error prevention
      'vue/no-mutating-props': 'error',
      'vue/require-v-for-key': 'error',
      'vue/no-use-v-if-with-v-for': 'error',
      'vue/no-duplicate-attributes': 'error',
      'vue/no-ref-as-operand': 'error',
      'vue/no-v-text-v-html-on-component': 'error',
      'vue/no-side-effects-in-computed-properties': 'error',
      'vue/no-async-in-computed-properties': 'error',
      'vue/no-computed-properties-in-data': 'error',
      'vue/return-in-computed-property': 'error',

      // Props & Composition API
      'vue/define-props-destructuring': 'error',
      'vue/no-setup-props-reactivity-loss': 'error',
      'vue/require-prop-types': 'error',
      'vue/require-default-prop': 'warn',
      'vue/require-explicit-emits': 'error',
      'vue/define-macros-order': [
        'error',
        {
          order: ['defineProps', 'defineEmits', 'defineOptions', 'defineSlots'],
          defineExposeLast: true,
        },
      ],

      // Component structure
      'vue/component-api-style': ['error', ['script-setup']],
      'vue/one-component-per-file': 'error',
      'vue/block-order': [
        'error',
        {
          order: ['script', 'template', 'style'],
        },
      ],
      'vue/component-definition-name-casing': ['error', 'PascalCase'],
      'vue/multi-word-component-names': 'warn',

      // Template best practices
      'vue/no-v-html': 'warn',
      'vue/attributes-order': 'warn',
      'vue/no-template-shadow': 'warn',
      'vue/no-unused-refs': 'warn',
      'vue/no-useless-v-bind': 'warn',
      'vue/prefer-true-attribute-shorthand': 'warn',
      'vue/html-self-closing': [
        'warn',
        {
          html: { void: 'always', normal: 'never', component: 'always' },
          svg: 'always',
          math: 'always',
        },
      ],

      // ──────────────────────────────────────────────
      // Disable formatting rules — oxfmt handles these
      // ──────────────────────────────────────────────
      'vue/max-attributes-per-line': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/html-indent': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/first-attribute-linebreak': 'off',
      'vue/html-closing-bracket-spacing': 'off',
      'vue/mustache-interpolation-spacing': 'off',
      'vue/no-multi-spaces': 'off',
      'vue/no-spaces-around-equal-signs-in-attribute': 'off',
    },
  },

  // Ignore non-Vue files — oxlint handles those entirely
  {
    ignores: ['**/*.ts', '**/*.js', '**/*.tsx', '**/*.jsx'],
  },

  // eslint-plugin-oxlint: auto-disables all ESLint rules that oxlint already covers.
  // Uses our oxlint categories + rules config to know exactly what to turn off.
  // MUST be last so it overrides any rules enabled above.
  ...oxlint.buildFromOxlintConfig({
    categories: {
      correctness: 'error',
      suspicious: 'warn',
      pedantic: 'warn',
      perf: 'warn',
    },
    plugins: ['typescript', 'unicorn', 'import', 'promise', 'vue', 'oxc'],
    rules: {
      eqeqeq: 'error',
      'no-else-return': ['error', { allowElseIf: false }],
      'no-console': 'warn',
      'prefer-const': 'error',
      curly: 'error',
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
      'import/no-cycle': 'error',
      'import/no-self-import': 'error',
      'import/no-duplicates': 'error',
      'promise/no-multiple-resolved': 'error',
      'promise/catch-or-return': 'warn',
      'vue/no-arrow-functions-in-watch': 'error',
      'vue/no-deprecated-destroyed-lifecycle': 'error',
      'vue/no-export-in-script-setup': 'error',
      'vue/no-lifecycle-after-await': 'error',
      'vue/prefer-import-from-vue': 'warn',
      'vue/valid-define-props': 'error',
      'vue/valid-define-emits': 'error',
    },
  }),
]
