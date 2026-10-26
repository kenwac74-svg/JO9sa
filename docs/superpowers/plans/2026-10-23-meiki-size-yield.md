# Meiki Yield by Monster Size Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task. User commit/push hold overrides commit steps.

**Goal:** WORK 명기 착정 보상을 크기별1.2/1.3/1.4/1.5/1.6배로 적용하고 사용자 제공 문구에 실제 지급량/증가율을 표시한다.
**Architecture:** 기본 semen_gain 표를 유지하고 해당 작업의 지급에만 정수 배율을 적용한다. 자동 작업은 지연 보고 전 성장할 수 있으므로 jo9_tentacle_report 한 배열의 역할별 gain/bonus 키에 지급값을 보관한다. 기존 성공 조건과 성장·소진·퀘스트 처리는 유지한다.
**Tech Stack:** Existing UTF-16 QSP codec, declarative mods/apply_mods.ps1, installed FastQSP.
**Spec:** User 2026-10-23 final multipliers and supplied special-success wording in this conversation; source hash pinned in prepared.json.

## Global Constraints
- WORK only; Full/ZIP/commit/push unchanged. Test-save creation remains explicitly paused.
- Ratios apply by actual tentacle_size0..4; base amount retains max(0,size-spawn_milked). Integer truncation yields14/23/33/96/201 on a full first harvest.
- Special wording preserves user prose, replacing role name and actual quantity/percent placeholders only.
- Do not edit base production/slime-salvage, storage cap, AP/refusal/success gates, growth, cooldown, quests, or skill advancement.
- One transient report array, saved normally when pending; cleared in new-game init and once before daily automatic work. Existing saves require no conversion.

## Review Focus
- Correct role for9actual awards and6statistics; manual dynslave delayed substitution.
- Auto AP0 reports after growth/death: new meiki gain and percentage must remain those captured at payment.
- Original success gates/effect lines remain identical. Normal growth-equality failure edge is outside this change.
- Missing cache in an old pending job: use old base amount/bonus0, ordinary success text, and no retroactive inventory award.
- Duplicate screen callbacks must not award inventory again or tally twice; original consumed auto flags remain.

### Task 1: Meaningful native regression and candidate
- [x] RED: execute original production award statements against independent expected-value tables.
- [x] Build exact patch:9actual award sites,6statistics,9special messages;6ordinary automatic quantity substitutions; report capture/fallback and2array reset hooks.
- [x] Assert exact user prose after placeholder normalization, expected changed fields only, all unrelated fields/effects preserved; byte roundtrip/CRLF/markers.

### Task 2: Verification and WORK install
- [x] GREEN: native fixed-table boundaries, actual report blocks and dynslave/manual interpolation, growth/death snapshots, legacy/no-double-award cases.
- [x] Existing official release gate9paths, exact replay and idempotence, template registry, input preservation.
- [x] Independent full diff review; install with existing apply_mods on unchanged pinned WORK; verify exact candidate hash.
- [x] Record manual/work bundle and save/Full preservation. Remove only verified regenerable diagnostic copies, retain one recovery QSP and replay patch.

Ruling: The report array is a required component of accurate new reward display; it does not add a character trait or change the save format. The original outer success gate is intentionally retained to avoid expanding quest/fullness effects. Old pending jobs are not retroactively boosted.

Completed: native1575+45, official9, independent static review, WORK exact hash 2958af5909714d4964cd03f243e8aa81fe515106cbf289de2e3dbb686d63193d. Commit/push held; no test saves created.
