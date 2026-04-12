# Frontmatter Support

This project supports a focused subset of Slidev frontmatter directly in the
playground runtime and style panel. Do not assume full upstream parity without
checking the parser, config resolver, and render pipeline.

## Source of Truth

Relevant code:

- `src/features/slides/frontmatter-schema.ts`
- `src/composables/useHeadmatter.ts`
- `src/features/editor/components/ConfigPanel.vue`
- `docs/slidev-markdown-spec.md`

## Global Headmatter

The app resolves document-level config from the first slide's headmatter using
`@slidev/parser` `resolveConfig()`.

The style/config panel currently exposes:

- `title`
- `colorSchema`
- `themeConfig.primary`
- `themeConfig.contrast`
- `fonts.sans`
- `fonts.mono`
- `canvasWidth`
- `aspectRatio`

These are edited surgically in markdown by `useFrontmatterEditor`, not by
re-serializing the entire frontmatter object.

## Per-Slide Frontmatter Used by the Renderer

`src/features/slides/frontmatter-schema.ts` explicitly recognizes:

- `layout`
- `transition`
- `background`
- `backgroundImage`
- `image`
- `class`
- `lineNumbers`
- `clicks`
- `disabled`
- `hide`

Notes:

- `class` accepts either a string or an array of strings
- `transition` affects presentation transitions
- `clicks` can override or inform click behavior for a slide
- `hide` and `disabled` are preserved as part of the supported shape even if a
  change only affects downstream render logic

## What To Verify Before Extending

When adding a new frontmatter field, check all three layers:

1. Upstream Slidev syntax and config meaning
2. Local schema acceptance in `frontmatter-schema.ts`
3. UI/editor affordances, if the field should be editable from the config panel

A field is not "supported" just because it appears in upstream docs. The local
playground only supports fields that its runtime or editor path actually uses.

## Config Panel Behavior

The config panel normalizes and constrains some values:

- `colorSchema` is limited to `auto | light | dark`
- `contrast` is limited to `30..100`
- `canvasWidth` must be a positive number
- `aspectRatio` is normalized to `16:9`, `4:3`, or `1:1`
- empty optional string fields remove the property from frontmatter

## Change Guidelines

- Keep the panel and runtime in sync when adding editable fields
- Preserve markdown formatting and comments when writing frontmatter updates
- Document any intentionally unsupported upstream fields rather than silently
  implying parity
