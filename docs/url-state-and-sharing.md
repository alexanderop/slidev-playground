# URL State and Sharing

This app is a pure client-side SPA. The deck lives in `window.location.hash`,
not in local storage or a backend.

## State Shape

`src/composables/useUrlSync.ts` supports two serialized formats:

1. Legacy format: compressed markdown string only
2. Current format: compressed JSON object with:

```json
{
  "m": "markdown source",
  "c": {
    "Quote.vue": "<template>...</template>"
  }
}
```

- `m` is the markdown source
- `c` is the optional custom component file map

If there are no component files, the app writes the compact legacy-style hash.
If there are component files, the app writes the JSON payload.

## Encoding and Decoding

- Compression uses `lz-string` via `compressToEncodedURIComponent`
- Hash updates are debounced by `DEBOUNCE_URL_MS` (`1000ms`)
- Markdown changes and component-file changes both update the hash
- Invalid or undecodable hashes fall back to the default deck and default
  component files

The decoder is intentionally backward-compatible:

- If the decompressed payload starts with `{`, it is treated as JSON state
- Otherwise it is treated as plain markdown from the older format

## Sharing Flow

`share()` forces the latest encoded state into the hash before generating the
share URL.

Behavior:

- If the Web Share API is available, the app calls `navigator.share`
- Otherwise it copies the full URL to the clipboard

This means share always uses the current state, even if the debounced hash write
has not fired yet.

## Component File Implications

Custom component files participate in shared state. A shared link can restore:

- the markdown deck
- every custom `.vue` component file open in the editor

This is why adding component-file support changes the hash format from plain
markdown to the `{ m, c }` JSON payload.

## Testing Notes

`src/test-utils/app-browser.ts` includes helpers for:

- encoding plain deck hashes
- decoding shared playground state
- rendering the app with either raw markdown or a prepared hash

Relevant test coverage lives in:

- `src/custom-components.browser.test.ts`
- `src/deck-loading.browser.test.ts`
- share assertions in `src/test-utils/page-objects/share-assertions.ts`

## Change Guidelines

- Preserve compatibility with legacy plain-markdown hashes
- Keep the serialized keys stable unless you also update test helpers
- Treat hash writes as user-visible API changes because existing shared URLs
  depend on them
- If you add new shared state, document whether it belongs in the compact
  legacy path, the JSON path, or both
