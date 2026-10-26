# QSP validation: PASS

- PASS — inputs-readable
- PASS — world-structure-and-line-endings
- PASS — slave-template-registry
- SKIP — distribution-byte-match: No mirror specified; this run does not verify the distribution copy
- PASS — patch-replay-and-idempotence
- PASS — installed-client-smoke
- PASS — input-hashes-unchanged

## Limits

- No GUI clicks or visual layout verification.
- Save data is used only to prime representative state. GUI save-file loading, CRC compatibility and full saved script restoration are NOT tested.
- Start is replaced only in diagnostic copies. Smoke covers lifecycle calls, not the character-selection UI or every gameplay branch.
- No complete QSP syntax checker: dynamic code and all game logic are not statically proved.
- Battle smoke instruments the menu dispatch only; full combat outcomes and balance are not tested.
