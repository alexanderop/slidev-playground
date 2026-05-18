# Vite+ Task Caching in This Project

This project uses Vite Task caching through `vp run`.

## What We Cache

In `vite.config.ts`, the `run.cache` block enables caching for both:

- tasks defined in `vite.config.ts`
- scripts executed through `vp run <script>`

That means these commands are cacheable:

```bash
vp run check
vp run lint
vp run ci
```

## Project-Specific Cached Tasks

The `ci` task is a fan-in aggregator over three real tasks, each with its own
`input` ignore globs so that `dist/`, `coverage/`, and `.vitest-attachments/`
churn never busts the cache:

```ts
'ci:check': { command: 'vp run check', input: [...] },
'ci:test':  { command: 'vp test',  dependsOn: ['ci:check'], input: [...] },
'ci:build': { command: 'vp build', dependsOn: ['ci:check'], env: ['NODE_ENV', 'VITE_*'], input: [...] },
ci: {
  command: 'echo "CI passed"',
  dependsOn: ['ci:check', 'ci:test', 'ci:build'],
  env: ['NODE_ENV', 'VITE_*'],
  untrackedEnv: ['CI', 'GITHUB_ACTIONS'],
},
```

Use it for repeatable verification with cache-aware replay:

```bash
vp run ci
```

`ci:test` and `ci:build` both depend on `ci:check`, so check runs once even when
all three are requested.

## Important Limitation

Vite+ caches and replays terminal output. It does **not** restore output files
like `dist/`.

Implication:

- `vp run ci` can skip rerunning `vp build` when inputs have not changed
- but it does not act like a remote build artifact cache
- if you delete `dist/`, rerun with `--no-cache` to force execution

```bash
vp run ci --no-cache
```

## When To Use What

- Use `vp run check` during normal editing.
- Use `vp run ci` before larger changes, handoff, or release-oriented verification.
- Use `vp build` directly when you explicitly want a fresh production build run.

## Cache Inputs We Care About

For `ci:build` and `ci` (which inherits env keys), cache invalidation includes:

- command arguments
- tracked environment variables: `NODE_ENV`, `VITE_*`
- files Vite Task auto-detects as inputs, minus the `dist/`, `coverage/`, and
  `.vitest-attachments/` excludes declared in `input`

Changes to `CI` and `GITHUB_ACTIONS` are passed through but do not invalidate
the cache.

## References

- Vite+ Run guide: https://viteplus.dev/guide/run
- Vite+ Task Caching guide: https://viteplus.dev/guide/cache
- Vite+ Run config reference: https://viteplus.dev/config/run
