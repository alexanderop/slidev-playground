const rawProjectFiles = import.meta.glob<string>(
  [
    '/**/*.md',
    '/**/*.mdx',
    '/**/*.txt',
    '/**/*.ts',
    '/**/*.tsx',
    '/**/*.js',
    '/**/*.jsx',
    '/**/*.vue',
    '/**/*.json',
    '/**/*.yaml',
    '/**/*.yml',
    '/**/*.css',
    '/**/*.html',
    '/**/*.sh',
    '!/node_modules/**',
    '!/dist/**',
    '!/coverage/**',
    '!/.git/**',
    '!/src/__screenshots__/**',
    '!/src/components/__screenshots__/**',
    '!/src/composables/__screenshots__/**',
  ],
  {
    query: '?raw',
    import: 'default',
    eager: true,
  },
)

function normalizeProjectPath(path: string): string {
  const withoutPrefix = path.startsWith('../') ? path.slice(2) : path
  const normalized = withoutPrefix.replaceAll('\\', '/')
  return normalized.startsWith('/') ? normalized : `/${normalized}`
}

export const projectFiles = Object.fromEntries(
  Object.entries(rawProjectFiles).map(([path, contents]) => [normalizeProjectPath(path), contents]),
)

export function readProjectFile(path: string): string | undefined {
  return projectFiles[path]
}
