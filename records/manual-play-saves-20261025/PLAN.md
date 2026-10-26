# Manual Play Save Pack Implementation Plan

> For agentic workers: execute the already authorized artifact task in this session; do not modify game logic or original saves.

**Goal:** Give the user ordinary game saves at useful checkpoints for post-patch verification and remaining bug reproduction.

**Architecture:** Domain recipe JSON files describe pure test state and original game entry routes. An isolated native factory saves rendered production screens; a separate inspection step checks normal load callbacks, complete cached script data, absence of automation, and input preservation before installing under a new WORK/save subfolder.

**Tech Stack:** Node.js, existing QSP codec, installed FastQSP, Windows Computer Use for representative real Load checks, ZIP.

**Spec:** The latest user request and the existing post-patch-playtest-20261025 report.

## Global Constraints

- WORK is authoritative; read its current QSP again. No game code edits, Full sync, commit or push.
- Preserve all original saves and personal state. Create a uniquely named save-pack subfolder, never overwrite.
- Use the existing adult fixtures without changing their age. Keep test funds/stats explicit in the guide.
- Classify checked features versus manual/reproduction cases; do not claim unresolved bugs were fixed.
- Do not activate held magic-brand reproduction or other deferred designs.
- Temporary files go under G:/Codex/tmp/manual-play-saves-20261025 and are cleaned after verification.

## Review Focus

- A save must open directly on the intended original screen and allow ordinary choices afterward.
- No test-driver JavaScript, stub destinations or diagnostic callbacks may remain in final files.
- Complete multi-line script caches and numeric/named array indices must survive; specifically preserve DEATH[0].
- Current source/hash and the factory save header must be checked; strict CRC support is a separate claim requiring real Load verification.
- Final artifact names, reproduction directions and actual state must agree; original files must remain byte-identical.

## Tasks

- [x] Pin WORK and original inputs; gather independent combat, economy and UI recipes.
- [x] Probe complete string/array restoration and native save creation, then build recipe factory.
- [x] Generate ordinary saves and inspect each checkpoint, callbacks, scripts, age, indices and expected state.
- [x] Perform representative actual game-menu Load and next-choice checks in a diagnostic copy.
- [x] Install the new pack and Korean guide, build review ZIP, verify hashes and original preservation.
- [x] Remove regenerable diagnostic copies and report installed paths plus unresolved symptoms.
