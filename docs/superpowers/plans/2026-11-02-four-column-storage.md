# Four-column storage implementation plan

User approved `records/lab-four-column-mockup-20261102/lab-four-columns-795x596.jpg` for game application on 2026-11-02. Implement only the inventory UI; Crowley menu and recipes remain pending.

- [x] Back up current QSP and base.css; verify QSP byte-exact roundtrip.
- [x] Native regression probe: execute the actual storage-rendering prefix with isolated dependency stubs. Expect four columns, six material entries and fourteen potion entries with correct nonzero quantities and category totals; assert no inventory changes. Cover lab/kitchen presence and absent facilities. Run original to observe missing split failure.
- [x] Change only `master_stat`: separate material and potion strings; keep warg molars in materials; display actual fat-minus quantity. Use scoped inline absolute coordinates matching approved mockup: x270/w210, x488/w185, x681/w180, x869/w170, top40, Sandoll 미생26px, line-height110%. Preserve other screens and CSS.
- [x] Run native probe to green; validate full QSP diff, official mods replay and idempotence; obtain independent review.
- [x] Guard against concurrent WORK changes, install verified QSP, record hashes/backup/handoff. Installed 2026-11-03 00:01 KST; post-install hash/roundtrip/CSS checks passed. User performs gameplay visual confirmation after reload.
