# Design: fix-reset-keeps-hint

## Decision

Guard at the press, not inside `resetBoard()`: `resetButton`'s handler returns at once when `hasEntries()` is false. `resetBoard()` itself keeps its full duties (it runs only after «Так, почати» on a board with entries), so the confirmed path is unchanged.

## Why not keep running `resetBoard()` on an untouched board

On a board with no entries every cell is already empty or given, `cell-hinted` is gone (the click that emptied the hinted cell removed it), the cause marker is gone (an emptying click breaks no rule), and the highlights come from the givens alone, so the only effect `resetBoard()` could still have is to clear the messages, which FR-58 forbids. Returning early is therefore exactly «changes nothing».

## Alternatives rejected

- Clear the messages and amend FR-58: offered to the user, not chosen.
- Track a «touched» flag: more state for the same result; `hasEntries()` is already the test the dialog uses.
