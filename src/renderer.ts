import katex from '@traptitech/markdown-it-katex'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
})

md.use(katex)

md.renderer.rules.heading_open = (tokens, idx, options, _env, self) => {
  const token = tokens[idx]
  token.attrJoin('class', 'slidev-heading')
  return self.renderToken(tokens, idx, options)
}

export function renderMarkdown(content: string): string {
  return md.render(content)
}
