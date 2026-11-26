# 원격 기준과 로컬 대기 변경

기준 저장소: `kenwac74-svg/JO9sa`.
원격 main: `653d674de4b08893c606003afc92b1062ec6ac83`.
조회: 2026-10-11 08:40 UTC, GitHub connector의 branches/main 응답.
[기준 커밋](https://github.com/kenwac74-svg/JO9sa/commit/653d674de4b08893c606003afc92b1062ec6ac83): Record Erza portrait replacement with ochre background, 2026-10-09T22:04:25Z.

## remote-baseline — 해당 SHA에서 직접 읽음

| 근거 | 확인한 기준 |
|---|---|
| [AGENTS.md](https://github.com/kenwac74-svg/JO9sa/blob/653d674de4b08893c606003afc92b1062ec6ac83/AGENTS.md) | 저장소 G:\somi\JO9sa, 플레이 G:\somi\JO9\game, 순정 G:\somi\JO9O, 카탈로그 G:\somi\IMGMG. 편집실 수정 전 VERIFICATION과 집컴 인계 확인 |
| [CLAUDE.md](https://github.com/kenwac74-svg/JO9sa/blob/653d674de4b08893c606003afc92b1062ec6ac83/CLAUDE.md) | QSP 직접 최소 변경, QSRC 재빌드 금지, 왕복 검증·백업·mods 기록, 사용자 플레이 확인 |
| [PROJECT.md](https://github.com/kenwac74-svg/JO9sa/blob/653d674de4b08893c606003afc92b1062ec6ac83/docs/PROJECT.md) | 기존 PM·로컬·이미지 역할표와 2.4 전환 이력. 다른 브랜치 이름은 역사·역할 참조이며 이번 기준 SHA로 승격하지 않음 |
| [SESSION_HANDOFF_INDEX.md](https://github.com/kenwac74-svg/JO9sa/blob/653d674de4b08893c606003afc92b1062ec6ac83/docs/SESSION_HANDOFF_INDEX.md) | 10월 4일 통합과 10월 6일·9일 인계를 연결. 10월 10일·11일 추가 항목은 없음 |
| [10월 4일 통합 인계](https://github.com/kenwac74-svg/JO9sa/blob/653d674de4b08893c606003afc92b1062ec6ac83/docs/session-handoffs/2026-10-04/README.md) | 기존 Codex 주 세션 유지, 최소 변경, 실제 QSP 기준, 사용자 게임 검증. 2.3 세이브 호환은 요구사항이며 검증 완료 아님 |
| [10월 6일 도구 인계](https://github.com/kenwac74-svg/JO9sa/blob/653d674de4b08893c606003afc92b1062ec6ac83/docs/modding/LOCAL_TOOLS_HANDOFF_2026-10-06.md) | 플레이본이 적용 기준, merge_work는 오래된 중간본. 체크 태그는 파일 삭제 승인 아님 |
| [10월 9일 도구 이전 인계](https://github.com/kenwac74-svg/JO9sa/blob/653d674de4b08893c606003afc92b1062ec6ac83/docs/MODDING_WORK_COMMIT_20261009.md) | 현재 도구 원본은 text-workshop/imgmg/image-workshop/local-workspace. cut-addition은 역사 사본. 테스트 수치는 당시 기록 |
| [10월 9일 동기화 규칙](https://github.com/kenwac74-svg/JO9sa/blob/653d674de4b08893c606003afc92b1062ec6ac83/docs/modding/WORKSPACE_SYNC_20261009.md) | 기존 작업번호·원장·개인 작업 이력 보존. 키·토큰·대용량 게임·생성 ZIP은 관리 묶음에서 제외 |
| [모딩 context-notes](https://github.com/kenwac74-svg/JO9sa/blob/653d674de4b08893c606003afc92b1062ec6ac83/docs/modding/context-notes.md) | 10월 10일 집 UI·시작 회귀 복구 및 이미지컷 저장 수정 기록이 원격에 있음. 새 실행 코드 CRLF, 왕복 검사와 실제 실행 검증 구분, 앞으로 플레이 확인은 보통 사용자 담당. 남자 주인공 기준 설계 결정도 기록 |

기준 SHA의 docs와 tools 바로 아래 목록도 읽었다. 이 기준 커밋에는 docs/team이 없으며 이번 문서 배포에서 신규 추가한다. 아래 3개 로컬 문서는 기준 SHA의 원격 docs 목록에 없다. 이미지·QSP 전체·모든 브랜치·과거 ZIP은 읽지 않았다.

## local-pending — 현 홈컴에서만 확인한 자료

| 자료·상태 | 근거와 한계 |
|---|---|
| docs/COMMUNITY_RELEASE_2_4_0.md | 로컬 파일과 10월 11일 홈컴 세션에서 확인. Codex 풀팩/간소화 담당, 미체크 전체 보기, (2) 자동 등록 검증 대기. 원격 해당 SHA docs 목록에는 없음 |
| 로컬 AGENTS.md/PROJECT.md/SESSION_HANDOFF_INDEX.md 추가 내용 | 로컬에는 10월 11일 배포 담당 갱신과 10월 10일 복구 인계가 추가돼 있음. 원격에서 읽은 같은 파일에는 해당 추가 내용 없음 |
| docs/COMBAT_MENU_RESTORATION_20261010.md | 로컬에서 복구·검사 기록 확인. 사용자 실제 화면 확인은 미완료. 원격 해당 SHA docs 목록에는 없음 |
| docs/LEGACY_SCENE_BUTTON_ALIGNMENT_20261010.md | 로컬 QSP 수정·Edge fixture 검사 기록. 실제 게임 확인을 대신하지 않음. 원격 해당 SHA docs 목록에는 없음 |
| 카탈로그·전환 mod·도구·자산 | 홈컴 마지막 세션 Git 출력에 main의 수정/미추적 항목으로 기록됨. 앞선 홈컴 조사에서 직접 Git 조회는 Permission denied. 현재 HEAD·diff·동기화 상태는 미확인 |
| 실제 플레이 QSP | 파일 존재·메타데이터만 확인. 10월 10일 로컬 복구 문서에는 247 locations라고 기록. 원본 전체를 해독하거나 이번에 검증하지 않음 |

위 로컬 추가 파일이 없다는 사실을 모든 10월 10일 작업이 원격에 없다는 뜻으로 확대하지 않는다. 원격 모딩 context-notes에는 별도의 10월 10일 복구 이력이 있다. 그 이력의 사용자 정상 확인과 미실시 플레이 경로를 그대로 구분한다.

local-pending 변경이 원격에 반영됐다고 보고하지 않는다. 이번 문서 전용 커밋에 로컬 게임·도구 변경을 포함하지 않는다. 향후 해당 작업이 승인되면 현재 diff와 출처를 확인해 포함/보류를 구분한다.

## 이번 사용자 승인 운영 결정

일반 기획 Chat·창관 기획 Chat·이미지제작기 Chat·기존 홈컴 Codex·dot의 역할 분담은 이번 직접 사용자 승인에 따른다. 원격 PROJECT.md의 옛 역할표와 구분한다. JO9_IMAGE_JOB는 부모의 Chat 조사에서 확인한 기존 규약으로, 이번에 원격 파일에서 확인한 규약이라고 주장하지 않는다.

## 유지할 불확실성과 취소

창관 프로토타입 v0.1 및 248/243 locations 불일치는 부모가 전달한 Chat 조사 결과다. 확인한 원격 범위에서 실제 QSP 통합 완료 근거를 확보하지 않았으므로 구현 완료로 표시하지 않는다.

툴팁 v0.2 이후 UI/Kura 통합 요청은 부모 조사에서 취소로 확인됐다. 원격 모딩 context-notes의 별도 쿠라 복구 이력과 구분한다. 실제 게임 배포물·외부 리소스 구성·플레이 검증·(2) 자동 등록·미사용 이미지 이동은 이번 문서 배포에서 실행하지 않는다.

이번 게시 대상은 신규 팀 문서 3개다. 문서 게시와 기존 실행 세션의 역할 전달 결과는 배포 보고에서 별도로 기록한다.

