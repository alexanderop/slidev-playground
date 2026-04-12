import type { Completion } from '@codemirror/autocomplete'
import { snippetCompletion } from '@codemirror/autocomplete'

function completion(label: string, type: Completion['type'], detail: string): Completion {
  return { label, type, detail }
}

export const frontmatterKeyCompletions: Completion[] = [
  completion('title', 'property', 'Presentation title'),
  completion('theme', 'property', 'Theme package name'),
  completion('layout', 'property', 'Slide layout'),
  completion('transition', 'property', 'Page transition'),
  completion('class', 'property', 'CSS classes applied to the slide'),
  completion('src', 'property', 'Import slides from another markdown file'),
  completion('clicks', 'property', 'Manual total click count'),
  completion('clicksStart', 'property', 'Initial click position'),
  completion('clickAnimation', 'property', 'Default click animation'),
  completion('colorSchema', 'property', 'Light, dark, or auto color scheme'),
  completion('canvasWidth', 'property', 'Canvas width in pixels'),
  completion('aspectRatio', 'property', 'Presentation aspect ratio'),
  completion('lineNumbers', 'property', 'Enable code block line numbers'),
  completion('fonts', 'property', 'Font configuration object'),
  completion('themeConfig', 'property', 'Theme-specific CSS variables'),
]

export const layoutValueCompletions: Completion[] = [
  completion('cover', 'enum', 'Cover slide'),
  completion('default', 'enum', 'Standard slide layout'),
  completion('center', 'enum', 'Centered content layout'),
  completion('intro', 'enum', 'Intro layout'),
  completion('section', 'enum', 'Section divider'),
  completion('statement', 'enum', 'Statement layout'),
  completion('quote', 'enum', 'Quote layout'),
  completion('fact', 'enum', 'Fact layout'),
  completion('image', 'enum', 'Image layout'),
  completion('image-right', 'enum', 'Image on the right'),
  completion('image-left', 'enum', 'Image on the left'),
  completion('iframe', 'enum', 'Iframe layout'),
  completion('iframe-right', 'enum', 'Iframe on the right'),
  completion('iframe-left', 'enum', 'Iframe on the left'),
  completion('two-cols', 'enum', 'Two column layout'),
  completion('two-cols-header', 'enum', 'Two columns with header'),
  completion('full', 'enum', 'Full canvas layout'),
  completion('none', 'enum', 'No layout wrapper'),
  completion('end', 'enum', 'End slide'),
  completion('404', 'enum', 'Not found layout'),
]

export const transitionValueCompletions: Completion[] = [
  completion('fade', 'enum', 'Fade transition'),
  completion('fade-out', 'enum', 'Fade out transition'),
  completion('slide-left', 'enum', 'Slide left transition'),
  completion('slide-right', 'enum', 'Slide right transition'),
  completion('slide-up', 'enum', 'Slide up transition'),
  completion('slide-down', 'enum', 'Slide down transition'),
  completion('view-transition', 'enum', 'View transition API'),
]

export const colorSchemaValueCompletions: Completion[] = [
  completion('auto', 'enum', 'Follow system preference'),
  completion('light', 'enum', 'Light mode only'),
  completion('dark', 'enum', 'Dark mode only'),
  completion('all', 'enum', 'Allow both modes'),
]

export const directiveCompletions: Completion[] = [
  snippetCompletion('v-click', {
    label: 'v-click',
    type: 'keyword',
    detail: 'Reveal on next click',
  }),
  snippetCompletion('v-after', {
    label: 'v-after',
    type: 'keyword',
    detail: 'Reveal after the previous click',
  }),
  snippetCompletion('v-click.hide', {
    label: 'v-click.hide',
    type: 'keyword',
    detail: 'Hide after its click step',
  }),
  snippetCompletion('v-click="${1:3}"', {
    label: 'v-click="3"',
    type: 'keyword',
    detail: 'Reveal at an absolute click position',
  }),
  snippetCompletion('v-click="[${1:2}, ${2:4}]"', {
    label: 'v-click="[2, 4]"',
    type: 'keyword',
    detail: 'Show within a click range',
  }),
  snippetCompletion('v-clicks', {
    label: 'v-clicks',
    type: 'keyword',
    detail: 'Sequentially reveal child items',
  }),
  snippetCompletion('every="${1:2}"', {
    label: 'every="2"',
    type: 'property',
    detail: 'Group v-clicks children by size',
  }),
  snippetCompletion('depth="${1:2}"', {
    label: 'depth="2"',
    type: 'property',
    detail: 'Apply v-clicks to nested list levels',
  }),
]

export const lineSnippetCompletions: Completion[] = [
  snippetCompletion('---\ntitle: ${1:Presentation Title}\nlayout: ${2:cover}\n---', {
    label: 'frontmatter block',
    type: 'snippet',
    detail: 'Insert presentation frontmatter',
  }),
  snippetCompletion('---\n\n# ${1:Slide title}', {
    label: 'new slide',
    type: 'snippet',
    detail: 'Start a new slide with a heading',
  }),
  snippetCompletion(
    '---\nlayout: two-cols\n---\n\n# ${1:Title}\n\n::left::\n${2:Left column}\n\n::right::\n${3:Right column}',
    {
      label: 'two-cols layout',
      type: 'snippet',
      detail: 'Create a two-column slide scaffold',
    },
  ),
  snippetCompletion(
    '---\nlayout: iframe-right\nurl: ${1:https://example.com}\n---\n\n# ${2:Title}\n\n${3:Context}',
    {
      label: 'iframe-right layout',
      type: 'snippet',
      detail: 'Create an iframe-right slide scaffold',
    },
  ),
  snippetCompletion('<div v-click>${}</div>', {
    label: 'v-click block',
    type: 'snippet',
    detail: 'Wrap content revealed on click',
  }),
  snippetCompletion('<div v-click="${1:3}">${2}</div>', {
    label: 'v-click at block',
    type: 'snippet',
    detail: 'Reveal content at an absolute click position',
  }),
  snippetCompletion('<div v-after>${}</div>', {
    label: 'v-after block',
    type: 'snippet',
    detail: 'Wrap content shown after the previous click',
  }),
  snippetCompletion('<div v-after.hide>${}</div>', {
    label: 'v-after.hide block',
    type: 'snippet',
    detail: 'Hide content after the previous click step',
  }),
  snippetCompletion('<div v-click.hide>${}</div>', {
    label: 'v-click.hide block',
    type: 'snippet',
    detail: 'Wrap content that hides after its click',
  }),
  snippetCompletion('<ul v-clicks>\n  <li>${}</li>\n</ul>', {
    label: 'v-clicks list',
    type: 'snippet',
    detail: 'Create a click-reveal list',
  }),
  snippetCompletion('<ul v-clicks every="${1:2}">\n  <li>${}</li>\n</ul>', {
    label: 'v-clicks every',
    type: 'snippet',
    detail: 'Reveal multiple items per click',
  }),
  snippetCompletion('::right::', {
    label: '::right::',
    type: 'snippet',
    detail: 'Named slot marker',
  }),
  snippetCompletion('---', {
    label: 'slide separator',
    type: 'snippet',
    detail: 'Start a new slide',
  }),
  snippetCompletion('<!--\n${}\n-->', {
    label: 'speaker notes',
    type: 'snippet',
    detail: 'Insert presenter notes block',
  }),
  snippetCompletion(
    '<!--\n${1:Always visible}\n[click] ${2:After first click}\n[click:2] ${3:After two more clicks}\n-->',
    {
      label: 'speaker notes with clicks',
      type: 'snippet',
      detail: 'Insert presenter notes with click markers',
    },
  ),
  snippetCompletion('```ts [${1:file.ts}] {lines:true}${2:{1|2-3}}\n${3}\n```', {
    label: 'code block with filename',
    type: 'snippet',
    detail: 'Insert a highlighted code fence with filename metadata',
  }),
  snippetCompletion('<<< @/snippets/${1:example.ts}', {
    label: 'snippet import',
    type: 'snippet',
    detail: 'Import code from a local snippet file',
  }),
]

export const componentCompletions: Completion[] = [
  snippetCompletion('<v-click>${}</v-click>', {
    label: '<v-click>',
    type: 'snippet',
    detail: 'Click animation wrapper',
  }),
  snippetCompletion('<v-after>${}</v-after>', {
    label: '<v-after>',
    type: 'snippet',
    detail: 'Show content with the previous click',
  }),
  snippetCompletion('<v-clicks>\n${}\n</v-clicks>', {
    label: '<v-clicks>',
    type: 'snippet',
    detail: 'Apply click animation to child items',
  }),
  snippetCompletion('<Arrow x1="${1:120}" y1="${2:120}" x2="${3:320}" y2="${4:220}" />', {
    label: '<Arrow />',
    type: 'snippet',
    detail: 'Arrow annotation component',
  }),
  snippetCompletion('<Youtube id="${1:dQw4w9WgXcQ}" />', {
    label: '<Youtube />',
    type: 'snippet',
    detail: 'Embedded YouTube video',
  }),
  snippetCompletion('<PoweredBySlidev />', {
    label: '<PoweredBySlidev />',
    type: 'snippet',
    detail: 'Built-in footer badge',
  }),
  snippetCompletion('<AutoFitText :max="${1:80}" :min="${2:20}">${}</AutoFitText>', {
    label: '<AutoFitText>',
    type: 'snippet',
    detail: 'Auto-resize text to fit',
  }),
  snippetCompletion('<CodeGroup>\n${}\n</CodeGroup>', {
    label: '<CodeGroup>',
    type: 'snippet',
    detail: 'Tabbed code block group',
  }),
  snippetCompletion('<Transform scale="${1:0.9}">\n  ${}\n</Transform>', {
    label: '<Transform>',
    type: 'snippet',
    detail: 'Apply transform wrapper',
  }),
  snippetCompletion(
    '<LightOrDark>\n  <template #light>${1:Light content}</template>\n  <template #dark>${2:Dark content}</template>\n</LightOrDark>',
    {
      label: '<LightOrDark>',
      type: 'snippet',
      detail: 'Render light and dark variants',
    },
  ),
  snippetCompletion('<SlideCurrentNo />', {
    label: '<SlideCurrentNo />',
    type: 'snippet',
    detail: 'Current slide number',
  }),
  snippetCompletion('<SlidesTotal />', {
    label: '<SlidesTotal />',
    type: 'snippet',
    detail: 'Total slide count',
  }),
  snippetCompletion('<v-mark ${1:color="orange"}>${}</v-mark>', {
    label: '<v-mark>',
    type: 'snippet',
    detail: 'Highlight content with rough notation',
  }),
]
