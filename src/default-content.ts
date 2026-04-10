export const defaultContent = `---
theme: default
title: Welcome to Slidev Playground
fonts:
  sans: Inter
  mono: Fira Code
themeConfig:
  primary: '#4fc08d'
---

# Welcome to Slidev

Presentation slides for developers

---

## What is Slidev?

Slidev is a slides maker and presenter designed for developers.

- Write slides in **Markdown**
- Style with themes and CSS
- Interactive code snippets
- Export to PDF, PNG, or host as SPA

---

## Styling from Frontmatter

Configure your deck globally in the headmatter:

\`\`\`yaml
---
fonts:
  sans: Poppins
  mono: JetBrains Mono
themeConfig:
  primary: '#e11d48'
colorSchema: dark
canvasWidth: 1200
---
\`\`\`

Try editing the headmatter above to see changes live!

---
background: '#1a1a2e'
class: text-white
---

## Per-Slide Background & Class

This slide uses frontmatter to set a dark background and white text:

\`\`\`yaml
---
background: '#1a1a2e'
class: text-white
---
\`\`\`

You can also use image URLs for backgrounds.

---

## Scoped Styles

Each slide can have its own \`<style>\` block:

\`\`\`html
<style>
h2 { color: #e879f9; }
blockquote { border-color: #e879f9; }
</style>
\`\`\`

> This blockquote and the heading above are styled with scoped CSS

<style>
h2 { color: #e879f9; }
blockquote { border-color: #e879f9; }
</style>

---

## Code Blocks

\`\`\`typescript [greet.ts] {2-4}
interface User {
  name: string
  role: 'admin' | 'user'
}

function greet(user: User): string {
  return \`Hello, \${user.name}!\`
}
\`\`\`

---

\`\`\`yaml
layout: two-cols
\`\`\`

## Two-Column Layout

Slidev slot sugar lets layouts expose named regions.

::right::

- This content renders into the \`right\` slot
- Layouts now behave more like Slidev layouts
- Try switching this slide to \`two-cols-header\`

---

## Math and Diagrams

Inline math works: $E = mc^2$

$$
int_0^1 x^2,dx = \frac{1}{3}
$$

\`\`\`mermaid
graph TD
  Editor --> Preview
  Preview --> Present
\`\`\`

---
transition: fade
---

## Click Animations

<!-- v-click -->
- First point appears on click

<!-- v-click -->
- Second point on next click

<!-- v-click -->
- Third point appears last

<!-- v-click -->
- Press **Space** or **Right Arrow** to advance

<!--
Speaker note: This slide demonstrates click animations.
Each bullet appears one at a time when you press Space or Right Arrow.
Press N to toggle this notes panel.
-->

---

## Keyboard Shortcuts

<!-- v-click -->
- **Space / Right** — Next step or slide

<!-- v-click -->
- **Left** — Previous step or slide

<!-- v-click -->
- **N** — Toggle speaker notes

<!-- v-click -->
- **O** — Toggle slide overview

<!-- v-click -->
- **Esc** — Exit presentation

---

# Thank You!

Start editing to create your own slides.

[Learn more at sli.dev](https://sli.dev)
`
