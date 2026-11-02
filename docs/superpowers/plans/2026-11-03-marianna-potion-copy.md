# Marianna potion naming and explanation

User specifies 마리아나, 아나볼릭(대사+), 코르티코(대사-), 메게이스(지방+), 위고비(지방-). Keep internal IDs, stock variables, image paths, purchase quantities/prices and effects unchanged. Update both product explanation branches1991/19914, retain four pages, explain four potions on page3, prepend supplied chaotic essence sentence to page4 before 마음껏 골라. Hide `#nwtx` comments in new dialogue. Normalize saved display strings and currently displayed HTML without replaying purchase/event actions.

- [x] Verify active installation, inspect effects and alternate/cached dialogue paths; back up QSP.
- [x] Verify actual dialogue/menu and legacy cache behavior in isolated native fixture, before and after patch;25checks passed.
- [x] Generate scoped patch; prove mechanics unchanged; official replay/idempotence; independent review passed.
- [x] Guard and apply to WORK; verify installed bytes; record backup and outstanding unrelated issues. Installed236ec161… on2026-11-03.
