# Treat Serialized Formats As Public API

Any format you serialize and hand to a user — URL hashes, exported files, shared links, persisted blobs — is a public API. Treat schema changes as breaking changes even when no internal caller depends on the old shape.

**Why:** With [[migrate-callers-then-delete-legacy-apis]] the callers are inside your repo, so you can find and update them. With serialized formats the "callers" are bookmarks, old shared URLs, files on user disks, and screenshots from blog posts. You cannot migrate them — they are already out in the wild. The shape you wrote yesterday is now load-bearing.

**Rule:**

- Add new fields as optional with defaults, never as required
- Keep decoders backward-compatible: detect format version and dispatch
- When breaking a format is unavoidable, version it explicitly and keep a legacy reader for at least one release
- Treat the encoder as having a stable contract documented in the codebase note, not just in code

**The Test:** "If a user opens a link they shared a year ago, does the app still load their deck?" If the answer depends on luck, the format is being treated as internal when it is public.

**Applies in this repo to:** the URL hash payload, exported deck files, any persisted browser-local state. See [[url-state-and-sharing]].
