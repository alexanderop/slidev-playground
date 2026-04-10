/**
 * Type augmentation for Vitest browser mode.
 *
 * `expect.element()` is provided at runtime by @vitest/browser but the
 * vite-plus wrapper doesn't re-export its type declarations.
 */
interface LocatorAssertion {
  toBeVisible(): Promise<void>
  toBeDisabled(): Promise<void>
  toBeEnabled(): Promise<void>
  toHaveTextContent(text: string | RegExp): Promise<void>
  toHaveAttribute(attr: string, value?: unknown): Promise<void>
  toHaveClass(...classNames: (string | RegExp)[]): Promise<void>
  toHaveStyle(css: string | Partial<CSSStyleDeclaration>): Promise<void>
  not: LocatorAssertion
}

declare global {
  const expect: {
    element(locator: unknown): LocatorAssertion
  }
}

declare module 'vite-plus/test' {
  interface ExpectStatic {
    element(locator: unknown): LocatorAssertion
  }
}
