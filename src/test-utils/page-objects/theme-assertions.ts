export class ThemeAssertions {
  expectFontFamilyVar(kind: 'sans' | 'mono', value: string) {
    expect(document.documentElement.style.getPropertyValue(`--slidev-fonts-${kind}`)).toContain(
      value,
    )
  }

  expectFontLinkLoaded() {
    const fontLink = document.querySelector('#slidev-playground-fonts')
    expect(fontLink instanceof HTMLLinkElement && fontLink.href).toContain('fonts.googleapis.com')
  }

  expectDarkMode(enabled = true) {
    expect(document.documentElement.classList.contains('dark')).toBe(enabled)
  }

  expectThemePrimary(value: string) {
    expect(document.documentElement.style.getPropertyValue('--slidev-theme-primary')).toBe(value)
  }
}
