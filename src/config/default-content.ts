export const defaultContent = `---
theme: default
title: Welcome to Slidev Playground
fonts:
  sans: Inter
  mono: Fira Code
themeConfig:
  primary: '#4fc08d'
---

# Welcome to Slidev <carbon:presentation-file />

Presentation slides for developers

<div @click="$slidev.nav.next" class="mt-12 py-1 cursor-pointer" style="opacity:0.6">
  Press Space for next page <carbon:arrow-right />
</div>

---
transition: fade-out
---

## What is Slidev?

Slidev is a slides maker and presenter designed for developers.

- <carbon:edit /> **Text-based** — focus on content with Markdown
- <carbon:color-palette /> **Themable** — themes can be shared as npm packages
- <carbon:code /> **Developer Friendly** — code highlighting, live coding
- <carbon:play-outline /> **Interactive** — embed Vue components to enhance slides
- <carbon:document-pdf /> **Portable** — export to PDF, PNGs, or host as SPA
- <carbon:tools /> **Hackable** — anything possible on a webpage is possible here

---

## Click Animations

<v-clicks>

- First point appears on click
- Second point on next click
- Third point appears last
- Press **Space** or **→** to advance

</v-clicks>

<!--
Speaker note: This slide demonstrates click animations.

[click] This note appears after the first click.

[click] Now the second bullet is visible too.

[click:2] Final note after all bullets appear.
-->

---
layout: two-cols
---

## Two-Column Layout

Slidev supports named slots for multi-column layouts.

Use \`::right::\` to split content.

\`\`\`yaml
---
layout: two-cols
---
Left content here

::right::

Right content here
\`\`\`

::right::

### Right Side

- This renders in the **right** slot
- Try \`image-right\` or \`two-cols-header\` too
- Layouts collapse on narrow screens

---

## Code Highlighting

Code blocks support line highlighting with step-through:

\`\`\`typescript {all|2-4|6-8|all}
interface User {
  name: string
  role: 'admin' | 'user'
}

function greet(user: User): string {
  return \\\`Hello, \\\${user.name}!\\\`
}
\`\`\`

Press **Space** to step through the highlights.

---

## Shiki Magic Move

Animate between code blocks with \`magic-move\`:

\`\`\`\`md magic-move
\`\`\`typescript
// Step 1: Start with a simple object
const user = {
  name: 'Alice',
  age: 30,
}
\`\`\`

\`\`\`typescript
// Step 2: Extract into an interface
interface User {
  name: string
  age: number
}

const user: User = {
  name: 'Alice',
  age: 30,
}
\`\`\`

\`\`\`typescript
// Step 3: Add a factory function
interface User {
  name: string
  age: number
}

function createUser(name: string, age: number): User {
  return { name, age }
}

const user = createUser('Alice', 30)
\`\`\`
\`\`\`\`

---
background: '#1a1a2e'
class: text-white
---

## Scoped Styles & Backgrounds

This slide uses **per-slide frontmatter** for a dark background:

\`\`\`yaml
---
background: '#1a1a2e'
class: text-white
---
\`\`\`

Each slide can also have its own \`<style>\` block for scoped CSS.

<style>
h2 {
  background: linear-gradient(45deg, #4EC5D4 10%, #146b8c 20%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
</style>

---

## Math & LaTeX

Inline math: $E = mc^2$ and $\\sqrt{3x-1}+(1+x)^2$

Block equations with click-through highlighting:

$$ {1|3|all}
\\begin{aligned}
\\nabla \\cdot \\vec{E} &= \\frac{\\rho}{\\varepsilon_0} \\\\
\\nabla \\cdot \\vec{B} &= 0 \\\\
\\nabla \\times \\vec{E} &= -\\frac{\\partial\\vec{B}}{\\partial t} \\\\
\\nabla \\times \\vec{B} &= \\mu_0\\vec{J} + \\mu_0\\varepsilon_0\\frac{\\partial\\vec{E}}{\\partial t}
\\end{aligned}
$$

---

## Diagrams

Mermaid diagrams render directly from code blocks:

\`\`\`mermaid
graph LR
  Markdown --> Parser
  Parser --> Renderer
  Renderer --> Slides
  Slides --> Present
\`\`\`

PlantUML is also supported:

\`\`\`plantuml
@startuml
actor User
User -> Editor : writes markdown
Editor -> Preview : live update
Preview -> Presentation : present mode
@enduml
\`\`\`

---

## Built-in Components

Embed a YouTube video:

<Youtube id="eW7v-2ZKZB8" width="400" height="225" />

Draw an arrow annotation:

<Arrow x1="50" y1="350" x2="200" y2="350" color="#4fc08d" width="2" />

---
transition: slide-up
---

## Keyboard Shortcuts

<v-clicks>

- **Space / →** — Next step or slide
- **← / Shift+Space** — Previous step or slide
- **↑ / ↓** — Jump between slides
- **G** — Go to slide dialog
- **O** — Slide overview
- **D** — Toggle dark mode
- **F** — Toggle fullscreen
- **N** — Toggle speaker notes
- **Esc** — Exit presentation

</v-clicks>

---

## Custom Components

Switch to the **Components** tab to define reusable Vue components.

<Quote author="Linus Torvalds">Talk is cheap. Show me the code.</Quote>

<Quote author="Albert Einstein" color="#e91e63">Imagination is more important than knowledge.</Quote>

<InfoCard title="How it works">
  Define components as Vue SFCs in the Components tab, then use them in your slides like any HTML tag.
</InfoCard>

---
layout: center
class: text-center
---

# Start Creating! <carbon:rocket />

Edit the markdown on the left to build your own slides.

[Learn more at sli.dev](https://sli.dev)

<PoweredBySlidev />
`

export const defaultComponentFiles: Record<string, string> = {
  'Quote.vue': `<script setup>
defineProps(['author', 'color'])
<\u002Fscript>

<template>
<blockquote class="custom-quote" :style="{ borderLeftColor: color || '#4fc08d' }">
  <slot />
  <cite v-if="author">\u2014 {{ author }}</cite>
</blockquote>
</template>

<style>
.custom-quote {
  padding: 0.8em 1.2em;
  margin: 0.8em 0;
  border-left: 4px solid;
  background: rgba(128, 128, 128, 0.06);
  border-radius: 0 6px 6px 0;
  font-style: italic;
}
.custom-quote cite {
  display: block;
  margin-top: 0.5em;
  font-size: 0.85em;
  font-style: normal;
  opacity: 0.7;
}
</style>`,

  'InfoCard.vue': `<script setup>
defineProps({ title: String })
<\u002Fscript>

<template>
<div class="info-card">
  <div class="info-card-title" v-if="title">{{ title }}</div>
  <slot />
</div>
</template>

<style>
.info-card {
  padding: 1em 1.2em;
  margin: 0.8em 0;
  border-radius: 8px;
  background: rgba(79, 192, 141, 0.08);
  border: 1px solid rgba(79, 192, 141, 0.25);
}
.info-card-title {
  font-weight: 600;
  font-size: 0.95em;
  margin-bottom: 0.4em;
  color: var(--slidev-theme-primary);
}
</style>`,
}
