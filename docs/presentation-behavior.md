# Presentation Behavior

This document describes how presentation mode behaves, including keyboard
shortcuts, dialog interactions, and the difference between click navigation and
slide navigation.

## Source of Truth

Relevant code:

- `src/features/presentation/composables/usePresentation.ts`
- `src/features/presentation/composables/usePresentationKeys.ts`
- `src/presentation.browser.test.ts`
- `src/user-flows.browser.test.ts`

## Core State

Presentation mode tracks:

- `presenting`
- `currentSlide`
- `currentClick`
- `navDirection`
- `showNotes`
- `showOverview`
- `showGotoDialog`

Navigation direction affects the chosen slide transition:

- forward navigation uses the previous slide's transition, defaulting to
  `slide-left`
- backward navigation uses the destination slide's transition, defaulting to
  `slide-right`

## Entering and Leaving Presentation

- `start(slideIndex = 0)` opens presentation mode at a specific slide and resets
  click state to `0`
- `stop()` closes presentation mode and also closes notes, overview, and goto
  dialogs
- Preview buttons can open a specific slide directly in presentation mode
- `g` and `o` can open goto or overview even before the user is already
  presenting; this implicitly starts presentation at slide `1`

## Click Navigation vs Slide Navigation

There are two different movement models:

- `next()` / `prev()` move through click reveals first, then move between slides
- `nextSlide()` / `prevSlide()` skip click steps and jump slides directly

Important semantics:

- `next()` increments `currentClick` until the slide's `totalClicks` is reached
- only after the last click does `next()` advance to the next slide
- `prev()` walks backward through click state first
- when moving backward to the previous slide, `prev()` restores that slide to
  its last click state
- `nextSlide()` always goes to the next slide and resets clicks to `0`
- `prevSlide()` goes to the previous slide and normally resets clicks to `0`

## Keyboard Shortcuts

This section is the current support matrix, based on
`src/features/presentation/composables/usePresentationKeys.ts` and the dialog
components.

### Global shortcuts

These work whenever focus is not inside a blocked input target:

- `p` starts presentation on slide `1`, or stops presentation if it is already open
- `o` opens or closes slide overview
- `` ` `` opens or closes slide overview
- `g` opens or closes the goto dialog
- `d` toggles dark mode
- `f` toggles fullscreen only while presenting

Behavior details:

- `o`, `` ` ``, and `g` can be used before presenting; they implicitly start
  presentation on slide `1`
- `o` and `` ` `` close goto when opening overview
- `g` closes overview when opening goto
- `f` is ignored when not presenting
- repeated `f` keydown events are ignored to avoid fullscreen toggle spam

### Presentation-only shortcuts

These only work after presentation mode has started:

- `n` toggles speaker notes
- `Escape` closes goto first, then overview, then exits presentation
- `Space` advances through click state first, then advances to the next slide
- `Shift+Space` moves backward through click state first, then to the previous slide
- `ArrowRight` advances through click state first, then advances to the next slide
- `Shift+ArrowRight` jumps directly to the next slide
- `ArrowLeft` moves backward through click state first, then to the previous slide
- `Shift+ArrowLeft` jumps directly to the previous slide
- `ArrowDown` jumps directly to the next slide
- `ArrowUp` jumps directly to the previous slide
- `PageDown` advances through click state first, then advances to the next slide
- `PageUp` moves backward through click state first, then to the previous slide

### Goto Dialog Keys

When the goto dialog input is focused, the dialog handles these keys itself:

- `Enter` jumps to the currently selected match
- `ArrowDown` moves the active selection down
- `ArrowUp` moves the active selection up
- `Escape` closes the dialog

Behavior details:

- an empty query lists every slide
- numeric filtering is substring-based on slide numbers
- if there are no matches, `Enter` closes the dialog without navigating

### Focus Blocking

Global presentation shortcuts are ignored while focus is inside:

- `textarea`
- `input`
- CodeMirror (`.cm-editor`)

This is intentional so typing in the editor or dialog fields does not trigger
presentation commands.

### Known Gaps

The app does not currently implement some keys people may expect from full
Slidev parity:

- no `Home` / `End` jump shortcuts
- no overview keyboard navigation layer beyond standard browser focus behavior
- no global `Enter` shortcut for next-slide navigation outside the goto dialog
- no separate `Shift+ArrowDown` / `Shift+ArrowUp` behavior

## Overview and Goto Dialogs

Overview behavior:

- opening overview closes goto
- selecting a slide closes overview and jumps to that slide
- overview can be opened before presenting and becomes the entry point into
  presentation mode

Goto behavior:

- opening goto closes overview
- goto can also be opened before presenting
- selecting a result jumps to the chosen slide and closes the dialog
- unmatched searches show "No matching slides."

While overview or goto is open, slide-navigation keys do not advance the deck.

## Speaker Notes

Speaker notes can contain click markers:

- `[click]`
- `[click:N]`

The note filter reveals segments progressively as `currentClick` increases.

Example:

```md
<!--
Always visible.
[click] Visible after first click.
[click:2] Visible two more clicks later.
-->
```

## Testing Notes

Browser tests currently cover:

- click-by-click presentation behavior
- overview entry and slide picking
- goto search and keyboard selection
- slide-boundary behavior for prev/next controls
- core shortcut parity with Slidev expectations
