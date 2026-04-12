# Theme System

The playground uses a runtime CSS-variable theme system with OKLCH-derived
tokens for the shell UI and slide content.

## Source of Truth

Relevant code:

- `src/composables/useTheme.ts`
- `src/styles/theme-tokens.css`
- `src/styles/slidev-vars.css`
- `src/features/editor/components/ConfigPanel.vue`

## Inputs

The main runtime inputs are:

- frontmatter `themeConfig.primary`
- frontmatter `themeConfig.contrast`
- frontmatter `colorSchema`
- runtime color mode override (`light | dark | auto`)

The config panel currently exposes:

- primary color
- contrast
- color mode
- canvas width
- aspect ratio
- fonts

## How Runtime Theme Application Works

`useTheme()` computes an `effectiveMode`:

1. runtime override wins if set to `light` or `dark`
2. otherwise frontmatter `colorSchema` wins if set to `light` or `dark`
3. otherwise `auto` follows `prefers-color-scheme`

On each reactive update it:

- toggles the root `dark` class
- writes `--slidev-theme-primary`
- converts the hex primary color to OKLCH and writes `--theme-accent`
- applies `themeConfig.contrast` to `--theme-contrast` when in the allowed range
- exposes other `themeConfig` entries as `--slidev-theme-*` CSS variables
- removes stale custom keys that no longer exist

## Token Layers

Two CSS token files work together:

- `src/styles/theme-tokens.css` for shell surfaces, borders, text, and shadows
- `src/styles/slidev-vars.css` for slide-content variables

Important built-in variables include:

- `--theme-base-hue`
- `--theme-accent`
- `--theme-contrast`
- `--slidev-theme-primary`

## Constraints

- `themeConfig.contrast` only applies when it is a finite number between `30`
  and `100`
- primary color is expected to be a hex color string because it is converted to
  OKLCH in `useTheme()`
- theming is applied to `document.documentElement`, so changes affect both shell
  UI and rendered slides

## Extension Guidelines

- Prefer adding new runtime theme values through `themeConfig` so they become
  CSS variables automatically
- If a new value needs validation or normalization, add it before writing the
  CSS variable
- Keep shell tokens and slide-content tokens distinct; do not collapse both
  layers into one stylesheet without a clear reason
- If you add new panel controls, document the corresponding frontmatter path and
  runtime CSS variable behavior
