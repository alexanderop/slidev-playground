# Vue Dual Linting: Vite+ (Oxlint) + ESLint Setup Guide

## Prerequisites: Vite+

This guide assumes you're using [Vite+](https://viteplus.dev), the unified toolchain that wraps Vite, Vitest, Oxlint, Oxfmt, Rolldown, and tsdown into a single CLI (`vp`). Vite+ manages oxlint through its `lint` config block in `vite.config.ts` — no separate `.oxlintrc.json` needed.

If you haven't migrated yet:

```bash
# Install the global CLI
curl -fsSL https://vite.plus | bash

# Migrate an existing Vite project
vp migrate
```

After migration, `vp check` runs formatting (Oxfmt), linting (Oxlint), and type checking (TypeScript) in a single command. `vp lint` runs Oxlint alone. All config lives in `vite.config.ts` via `defineConfig` from `vite-plus`.

For more on Vite+, see the [Getting Started guide](https://viteplus.dev/guide/) and [Configuration reference](https://viteplus.dev/config/).

## The Problem

Oxlint (via Vite+) is extremely fast and covers JS, TS, imports, promises, and unicorn rules natively. However, its Vue plugin only supports **13 script-level rules**. It cannot lint `<template>` blocks because it lacks a Vue template parser.

This means critical Vue rules like `define-props-destructuring`, `no-mutating-props` (in templates), `require-v-for-key`, `attributes-order`, and `block-order` are unavailable in oxlint today.

To visualize the gap — here's what each tool can and can't see in a `.vue` file:

```
  Component.vue
  ┌─────────────────────────────────────┐
  │ <script setup lang="ts">            │  Oxlint: YES
  │   const { msg } = defineProps<{     │  ESLint: disabled (oxlint covers it)
  │     msg: string                     │
  │   }>()                              │
  │ </script>                           │
  ├─────────────────────────────────────┤
  │ <template>                          │  Oxlint: NO  (no template parser)
  │   <div v-for="item in items">      │  ESLint: YES (vue-eslint-parser)
  │     {{ item.name }}                 │
  │   </div>                            │
  │ </template>                         │
  ├─────────────────────────────────────┤
  │ <style scoped>                      │  Oxfmt: YES (formatting)
  │   .box { color: red }              │  Neither linter checks CSS
  │ </style>                            │
  └─────────────────────────────────────┘
```

### Why can't oxlint just run eslint-plugin-vue?

Oxlint supports JavaScript ESLint plugins via `jsPlugins`, but `eslint-plugin-vue` requires `vue-eslint-parser` to produce a modified AST for template traversal. Oxlint doesn't use this parser, so all template-aware rules fail with "Use the latest vue-eslint-parser" errors.

### Current status (April 2026)

- **Issue:** [oxc-project/oxc#15761](https://github.com/oxc-project/oxc/issues/15761) — "oxlint: better vue support"
- **Milestone:** Oxlint Q2 (due June 30, 2026)
- **PR:** [oxc-project/oxc#19133](https://github.com/oxc-project/oxc/pull/19133) — POC that transforms Vue SFCs into JSX AST for oxlint. All tests pass, awaiting maintainer review.
- **Parallel effort:** [vize](https://github.com/ubugeeei/vize) by a Vue core contributor — a from-scratch Rust Vue compiler + linter, planned as an oxlint JS plugin.

Realistically, basic template-aware Vue linting in oxlint could land mid-2026. Full `eslint-plugin-vue` parity is further out.

## The Solution: Dual Linting

Run oxlint for everything it's good at (fast, covers JS/TS/imports/promises), and ESLint **only** for template-aware Vue rules. The official `eslint-plugin-oxlint` package prevents duplicate rule checking between the two.

```
oxlint (via vp lint)          ESLint (eslint-plugin-vue)
├── JS/TS correctness         ├── Template-aware Vue rules
├── TypeScript strictness     │   ├── define-props-destructuring
├── Import hygiene            │   ├── no-mutating-props
├── Promise safety            │   ├── require-v-for-key
├── Unicorn modern JS         │   ├── attributes-order
├── Vue script-level rules    │   ├── block-order
│   ├── valid-define-props    │   ├── no-use-v-if-with-v-for
│   ├── valid-define-emits    │   └── ... (27 rules total)
│   ├── no-lifecycle-after-await
│   └── ... (13 rules)       eslint-plugin-oxlint
└── Formatting (oxfmt)        └── Auto-disables 226 ESLint rules
                                  that oxlint already covers
```

## Step-by-Step Setup

### 1. Install dependencies

Use `vp add` (Vite+'s package management command — wraps your package manager):

```bash
vp add -D eslint eslint-plugin-vue vue-eslint-parser @vue/eslint-config-typescript eslint-plugin-oxlint
```

> **Note:** Do not install `oxlint` directly — Vite+ bundles it. Do not use `pnpm add` or `npm install` directly — always go through `vp add` / `vp remove` / `vp install`.

### 2. Configure oxlint in `vite.config.ts`

Vite+ consolidates all tool config into `vite.config.ts`. Oxlint is configured in the `lint` block using `defineConfig` from `vite-plus`. Enable all native Vue rules here:

```ts
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite-plus'

export default defineConfig({
  plugins: [vue()],

  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
    categories: {
      correctness: 'error',
      suspicious: 'warn',
      pedantic: 'warn',
      perf: 'warn',
    },
    plugins: ['typescript', 'unicorn', 'import', 'promise', 'vue', 'oxc'],
    rules: {
      // JS/TS rules ...

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
    },
  },
})
```

### 3. Create `eslint.config.js` for template-aware Vue rules

The config is a flat array where **order matters**. Later entries override earlier ones:

```
eslint.config.js — config layering order
┌───────────────────────────────────────────┐
│ 1. pluginVue.configs['flat/recommended']  │  Enables ~50 Vue rules
├───────────────────────────────────────────┤
│ 2. Your rule overrides                    │  Tune severity, add uncategorized
│    - template-aware rules: error/warn     │  rules, disable formatting rules
│    - formatting rules: off                │
├───────────────────────────────────────────┤
│ 3. oxlint.buildFromOxlintConfig(...)      │  MUST be last — turns off 226
│    reads your oxlint config and disables  │  ESLint rules oxlint covers
│    all overlapping rules                  │
└───────────────────────────────────────────┘
```

```js
import oxlint from 'eslint-plugin-oxlint'
import pluginVue from 'eslint-plugin-vue'

export default [
  // Vue recommended preset
  ...pluginVue.configs['flat/recommended'],

  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: '@typescript-eslint/parser',
      },
    },
    rules: {
      // Template-aware rules — the reason ESLint is here

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

      // Disable formatting rules — oxfmt handles these
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

  // Only lint .vue files — oxlint handles everything else
  {
    ignores: ['**/*.ts', '**/*.js', '**/*.tsx', '**/*.jsx'],
  },

  // MUST be last: auto-disables ESLint rules that oxlint already covers.
  // Pass the same categories/plugins/rules as your vite.config.ts lint block.
  ...oxlint.buildFromOxlintConfig({
    categories: {
      correctness: 'error',
      suspicious: 'warn',
      pedantic: 'warn',
      perf: 'warn',
    },
    plugins: ['typescript', 'unicorn', 'import', 'promise', 'vue', 'oxc'],
    rules: {
      // Mirror the rules from vite.config.ts that have ESLint equivalents.
      // eslint-plugin-oxlint uses this to know what to turn off.
      eqeqeq: 'error',
      'no-console': 'warn',
      'prefer-const': 'error',
      curly: 'error',
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
```

### 4. Wire up scripts in `package.json`

`vp check` runs Oxfmt + Oxlint + TypeScript in one shot. Chain ESLint after it for the full picture:

```json
{
  "scripts": {
    "dev": "vp dev",
    "build": "vp build",
    "check": "vp check && vp exec eslint --no-warn-ignored .",
    "lint": "vp lint && vp exec eslint --no-warn-ignored .",
    "lint:vue": "vp exec eslint --no-warn-ignored .",
    "fmt": "vp fmt",
    "test": "vp test",
    "prepare": "vp config"
  }
}
```

- `vp run check` — full check (format + oxlint + tsc + ESLint vue template rules)
- `vp run lint` — just linting (oxlint + ESLint)
- `vp run lint:vue` — only ESLint template rules (useful for debugging)
- `vp run fmt` — Oxfmt formatting only
- `prepare` / `vp config` — sets up Vite+ git hooks

### 5. Wire up pre-commit hooks in `vite.config.ts`

Vite+'s `staged` block configures pre-commit hooks (set up by `vp migrate` or `vp config`). Run both linters on `.vue` files:

```ts
staged: {
  '*.{ts,tsx}': 'vp check --fix',
  '*.vue': 'vp check --fix && vp exec eslint --no-warn-ignored',
},
```

## What Happens When You Run `vp run check`

```
vp run check
│
├─► vp check (Vite+)
│   │
│   ├─► Oxfmt ─────── format all files (ts, vue, json, css, html)
│   ├─► Oxlint ────── lint JS/TS + Vue <script> blocks
│   │   │
│   │   ├── 4 categories: correctness, suspicious, pedantic, perf
│   │   ├── 6 plugins: typescript, unicorn, import, promise, vue, oxc
│   │   └── 13 native Vue rules (script-level only)
│   │
│   └─► TypeScript ── type check (tsc --noEmit)
│
└─► eslint . (ESLint)
    │
    ├─► vue-eslint-parser ── parse .vue <template> blocks
    ├─► eslint-plugin-vue ── 27 template-aware rules
    └─► eslint-plugin-oxlint
        └── auto-disabled 226 rules that oxlint already covers
            (reads categories + plugins + rules from config)
```

## How eslint-plugin-oxlint Works

The `buildFromOxlintConfig()` function is the key. It takes the same config shape as oxlint (categories, plugins, rules) and generates ESLint flat config entries that set every overlapping rule to `'off'`.

In our setup it auto-disables **226 rules**:

| Plugin             | Rules disabled |
| ------------------ | -------------- |
| Core ESLint        | 102            |
| Unicorn            | 70             |
| TypeScript         | 29             |
| Vue (script-level) | 10             |
| Import             | 9              |
| Promise            | 6              |

This means ESLint only checks the ~27 template-aware Vue rules that oxlint can't handle.

**Important:** The `...oxlint.buildFromOxlintConfig()` spread must be the **last** entry in the config array so it overrides rules enabled by earlier presets.

The two config files reference the same oxlint rule set — keep them in sync:

```
vite.config.ts                    eslint.config.js
┌──────────────────────┐          ┌──────────────────────────┐
│ lint: {              │          │ oxlint.buildFromOxlintConfig({
│   categories: {...}  │──SAME──►│   categories: {...}      │
│   plugins: [...]     │──SAME──►│   plugins: [...]         │
│   rules: {           │──SAME──►│   rules: {               │
│     eqeqeq: 'error'  │         │     eqeqeq: 'error'      │
│     vue/...: 'error'  │         │     vue/...: 'error'      │
│   }                  │          │   }                      │
│ }                    │          │ })                       │
└──────────────────────┘          └──────────────────────────┘
   oxlint reads this                ESLint uses this to know
   for actual linting               what to turn OFF
```

If you add a new rule to oxlint, add it to `buildFromOxlintConfig` too — otherwise ESLint will still check it redundantly.

## Why not just use ESLint for everything?

Speed. Oxlint (via Vite+) is 50-100x faster than ESLint for JS/TS linting. On this project:

- `vp check` (Oxfmt + Oxlint + tsc): ~500ms
- `eslint .` (Vue template rules only): ~800ms

If ESLint handled all rules, every check would take multiple seconds. The dual setup keeps the fast path fast and only uses ESLint where oxlint has a gap.

Vite+ also gives you a single `vp check` command that runs formatting, linting, and type checking in parallel — something that would require multiple tools and scripts with a pure ESLint setup.

## When to remove ESLint from this setup

Watch [oxc-project/oxc#15761](https://github.com/oxc-project/oxc/issues/15761). When oxlint ships Vue template parsing (expected mid-2026 via the Q2 milestone), you can collapse everything back to Vite+ only:

1. Move template-aware rules to the `lint.rules` block in `vite.config.ts`
2. Delete `eslint.config.js`
3. Remove ESLint dependencies:
   ```bash
   vp remove -D eslint eslint-plugin-vue vue-eslint-parser @vue/eslint-config-typescript eslint-plugin-oxlint
   ```
4. Simplify scripts back to just `vp check` / `vp lint` (remove the `&& eslint` chains)
5. Simplify `staged` back to `'*.{ts,tsx,vue}': 'vp check --fix'`

At that point, `vite.config.ts` is the single source of truth for all tooling — which is the whole point of Vite+.
