# R05 Voice Policy Implementation Plan

> Execute inline using superpowers:executing-plans and targeted RED/GREEN verification. No commit/push or Full sync.

**Goal:** 일반노예직업반말을제거하고8명기본과캐릭터별반말ON/OFF를보존한다.

**Architecture:** 기존조립기서명에인물말투값을전달하고jo9_plain_voice에서기본/켜기/끄기를결정한다. 알수있는저장콜백조각만치환한다.

**Tech Stack:** QSP/Node.js/설치FastQSP/공식apply_mods.

**Spec:** G:/somi/JO9sa/records/release-r05-voice-policy-20261113/SPEC_KO.md

## Constraints

- 인물별문자열키jo9_plain_tone 1개,전역배열추가0. -1/0/1만문서화.
- 8명기본유지,일반직업반말제거,수치/내용/관계선택보존.
- 임계값자동조건·JSON/편집기UI확장·대사새작성은범위밖.

## Review focus

- 11일반직업/10격식직업/8기본유니크와명시ON/OFF.
- 주화자/조수화자/평가대상분리와역할교환.
- 완성문장정확교정·고유설정호환가드·사용자문장보존.
- 구캐시2회갱신/메모보존/미지정기본0/저장왕복.
- 기존배열의필드1개만추가하고임계값이수치를건드리지않음.

## Steps

- [ ] RED실제엔진: 직업·플래그·화자·캐시·보존.
- [ ] 4개본문의최소변경과선언형mod.
- [ ] GREEN및새코드문법/줄·주석/패치재생/멱등/역검증.
- [ ] WORK/추적QSP/원장·정책문서·릴리즈·인수인계갱신.
- [ ] 보고/재현스크립트보존·작업임시사본정리.
