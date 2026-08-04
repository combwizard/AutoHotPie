# AutoHotkey v2 runtime (side-by-side)

The shipping runtime remains AutoHotkey **v1.1** (`src/PieMenu.ahk`).

This folder holds the incremental v2 port. It must:

- Consume the same `AHPSettings.json` contract (`schemaVersion`)
- Pass the same fixtures under `tests/fixtures/settings`
- Remain non-default until parity gates pass

## Port order

1. `geometry.ahk` / JSON load helpers
2. Profile + hotkey registration
3. Action registry (replace dynamic `%fn%()` dispatch)
4. Input / activation modes
5. GDI+ rendering via a maintained v2-compatible library

Do not delete or break the v1 entrypoints while this work is incomplete.
