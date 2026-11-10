# Residence BGM implementation plan

Approved spec: user approval on 2026-11-11 of the residence/fame playlist proposal in this chat. WORK baseline is 2bafb73a… .

## Scope and decisions

- Noble status or brand reputation >=5 selects honor first. Otherwise use the adopted residence district song.
- Existing standard 0..5 fame fields for taurus, serpis, kamira, korvus, otchuzhdenie, RedLight, centralkvartal qualify at >=4. No independent fame is invented for slums/White City.
- Base first; deduplicate actual paths. Three distinct extra districts produce four tracks. Adopted outside/necropolis/redlight MP3s come from the existing user sound folder, with no binary Git upload.
- City visits and unchanged redraws preserve the current song/deadline. Residence/base/eligible playlist changes rebuild from the base. Special music interrupts the list; returning restarts the interrupted list song, since the native player has no seek interface here.
- Single-track list keeps looping. Multiple tracks use native playback plus the validated HTML Date.now/sessionStorage clock. Close only the prior BGM path, never all audio.
- Settings keep prior music. Old/blank city selections recover via normal rules. Load invalidates old callbacks; old saves do not require the separately deferred D21 tool.
- Small queue/index/token globals are added to ordinary QSP state; character data and save format are not migrated. Existing sound/mute/volume and gameover hooks retain priority.

## Execution

Ruling: implement inline in an isolated G:/Codex/tmp candidate, then apply to current WORK after tests. User approval already covers this implementation; do not ask again or commit/push/modify Full. Existing repository edits must be preserved.

- [x] Write clock tests; observe missing implementation failure; implement the ES5 clock and pass tests.
- [x] Write native queue/priority/stale-callback assertions; observe failure on baseline; implement jo9_residence_bgm and QSP hooks.
- [x] Generate duration/hash metadata with ffprobe. Native real HTML timer tests cover full sequence, redraw, special interruption, mute, stale callbacks and single-track behavior.
- [x] Review integration; replay/reapply the declarative patch; verify structure/markers and exact changed locations.
- [x] Install WORK, source JS/QSP/manifest and three local adopted MP3s. Preserve prior audio/settings/check state; update handoff/manual; clean generated diagnostics.

Review focus: duplicate deadlines across page reloads; stale callbacks after load/combat; original effect sounds surviving BGM changes; settings and volume changes not resetting songs; cached old dynamic definitions.

Rulings after native review: split LOCAL initialization; use an explicit duplicate flag outside FOR; track direct event path/key/original volume channel; bind native results to the candidate hash; verify all occurrences of multi-count edits. Runtime and documentation complete; diagnostic cleanup is recorded separately in cleanup.json.
