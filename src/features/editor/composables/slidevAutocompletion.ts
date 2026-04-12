import type { CompletionContext, CompletionResult } from '@codemirror/autocomplete'
import { autocompletion } from '@codemirror/autocomplete'
import {
  colorSchemaValueCompletions,
  componentCompletions,
  directiveCompletions,
  frontmatterKeyCompletions,
  layoutValueCompletions,
  lineSnippetCompletions,
  transitionValueCompletions,
} from './slidev-completion-data'

export const slidevAutocompletion = autocompletion({
  activateOnTyping: true,
  override: [slidevCompletionSource],
})

export function slidevCompletionSource(context: CompletionContext): CompletionResult | null {
  const line = context.state.doc.lineAt(context.pos)
  const lineBefore = line.text.slice(0, context.pos - line.from)
  const trimmedBefore = lineBefore.trimStart()

  const frontmatterResult = completeFrontmatter(context, line, lineBefore)
  if (frontmatterResult) {
    return frontmatterResult
  }

  const tagAttributeMatch = /<[^>\n]*\s([:@\w.-]*)$/.exec(lineBefore)
  if (tagAttributeMatch) {
    return {
      from: context.pos - tagAttributeMatch[1].length,
      options: directiveCompletions,
      validFor: /^[:@\w.-]*$/,
    }
  }

  const componentMatch = /<\/?([A-Za-z][\w-]*)$/.exec(lineBefore)
  if (componentMatch) {
    return {
      from: context.pos - componentMatch[1].length - 1,
      options: componentCompletions,
      validFor: /^<\/?[A-Za-z][\w-]*$/,
    }
  }

  if (/^(::?[\w.:-]*)?$/.test(trimmedBefore) || trimmedBefore === '') {
    return {
      from: context.pos - trimmedBefore.length,
      options: lineSnippetCompletions,
      validFor: /^(?:::?[\w.:-]*)?$/,
    }
  }

  if (trimmedBefore.startsWith('<<<')) {
    return {
      from: line.from + line.text.indexOf('<<<'),
      options: lineSnippetCompletions.filter((option) => option.label === 'snippet import'),
      validFor: /<<<.*/,
    }
  }

  return null
}

function completeFrontmatter(
  context: CompletionContext,
  line: { from: number; text: string },
  lineBefore: string,
): CompletionResult | null {
  if (!isInsideFrontmatter(context)) {
    return null
  }

  const layoutMatch = /^(\s*layout:\s*)([\w-]*)$/.exec(lineBefore)
  if (layoutMatch) {
    return {
      from: line.from + layoutMatch[1].length,
      options: layoutValueCompletions,
      validFor: /^[\w-]*$/,
    }
  }

  const transitionMatch = /^(\s*transition:\s*)([\w-]*)$/.exec(lineBefore)
  if (transitionMatch) {
    return {
      from: line.from + transitionMatch[1].length,
      options: transitionValueCompletions,
      validFor: /^[\w-]*$/,
    }
  }

  const colorSchemaMatch = /^(\s*colorSchema:\s*)([\w-]*)$/.exec(lineBefore)
  if (colorSchemaMatch) {
    return {
      from: line.from + colorSchemaMatch[1].length,
      options: colorSchemaValueCompletions,
      validFor: /^[\w-]*$/,
    }
  }

  const keyMatch = /^(\s*)([\w-]*)$/.exec(lineBefore)
  if (!keyMatch) {
    return null
  }

  return {
    from: line.from + keyMatch[1].length,
    options: frontmatterKeyCompletions,
    validFor: /^[\w-]*$/,
  }
}

function isInsideFrontmatter(context: CompletionContext) {
  const doc = context.state.doc
  const currentLine = doc.lineAt(context.pos).number
  let openingLine = -1

  for (let lineNumber = currentLine; lineNumber >= 1; lineNumber -= 1) {
    if (doc.line(lineNumber).text.trim() === '---') {
      openingLine = lineNumber
      break
    }
  }

  if (openingLine === -1) {
    return false
  }

  for (let lineNumber = openingLine + 1; lineNumber <= doc.lines; lineNumber += 1) {
    if (doc.line(lineNumber).text.trim() === '---') {
      return currentLine > openingLine && currentLine < lineNumber
    }
  }

  return false
}
