# Current PR stack

Merge in order so each PR shows only its own delta:

1. [#1 foundation baseline](https://github.com/combwizard/AutoHotPie/pull/1) — toolchain, CI, settings contract tests
2. [#2 IPC harden](https://github.com/combwizard/AutoHotPie/pull/2) — Electron trust boundary + settings defect fixes
3. [#3 runtime reliability](https://github.com/combwizard/AutoHotPie/pull/3) — DPI, standalone flag, diagnostics
4. [#4 editor modules](https://github.com/combwizard/AutoHotPie/pull/4) — `AHPDomain` custom-function helpers
5. [#5 AHK v2 stubs](https://github.com/combwizard/AutoHotPie/pull/5) — side-by-side v2 geometry/settings stubs
6. [#6 release docs](https://github.com/combwizard/AutoHotPie/pull/6) — triage + release ownership for the fork

After each merge, rebase the next branch onto the updated predecessor.
