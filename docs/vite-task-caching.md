# Vite+ Task Caching in This Project

This project uses Vite Task caching through `vp run`.

## What We Cache

In [vite.config.ts](/Users/alexanderopalic/Projects/opensource/slidev-playground/vite.config.ts), the `run.cache` block enables caching for both:

- tasks defined in `vite.config.ts`
- scripts executed through `vp run <script>`

That means these commands are cacheable:

```bash
vp run check
vp run lint
vp run ci
```

## Project-Specific Cached Task

We define a `ci` task in `vite.config.ts`:

```ts
ci: {
  command: 'vp run check && vp test && vp build',
  env: ['NODE_ENV', 'VITE_*'],
  untrackedEnv: ['CI', 'GITHUB_ACTIONS'],
}
```

Use it when you want a repeatable verification pass with cache-aware replay:

```bash
vp run ci
```

## Important Limitation

Vite+ currently caches and replays terminal output. It does **not** restore output files like `dist/`.

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

For the `ci` task, cache invalidation includes:

- command arguments
- tracked environment variables: `NODE_ENV`, `VITE_*`
- files Vite Task automatically detects as inputs

Changes to `CI` and `GITHUB_ACTIONS` are passed through but do not invalidate the cache.

## Current Repo Caveat

Right now `vp test` fails if there are no matching test files for:

```bash
src/**/*.test.ts
```

So `vp run ci` will also fail until test files exist or the test setup is adjusted.

## References

- Vite+ Run guide: https://viteplus.dev/guide/run
- Vite+ Task Caching guide: https://viteplus.dev/guide/cache
- Vite+ Run config reference: https://viteplus.dev/config/run
