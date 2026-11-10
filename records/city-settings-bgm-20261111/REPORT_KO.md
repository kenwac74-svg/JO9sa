# 도시 설정창의 기존 BGM 유지 — 2026-11-11

사용자 승인: 도시 설정창에서 누락된 `city.mp3`를 선택하는 대신 직전 음악을 유지한다. 귀족 신분·평판·거주지에 따른 원래 선택을 보존하며 음원은 추가하지 않는다.

## 원인과 변경

도시 설정 버튼은 `city_form=1000`으로 설정한다. `#dynamic`의 `$city_sounds`는 이 경우 `$toplay='city'`를 강제로 지정했고, `$play_music`가 `$music['city']='content/snd/city.mp3'`를 재생하려 했다. 현재 WORK에는 이 파일이 없다. 일반 도시 화면에서는 귀족 신분 또는 평판5 이상이면 `honor`, 그 외 빈민가 거주이면 `poor`, 나머지는 `citizen`을 선택한다.

`CITY_SETTINGS_BGM_KEEP_20261111`에서 `$city_sounds`만 수정했다.

- 설정창에서는 기존 `$toplay`를 유지한다. 보통 도시곡뿐 아니라 야간곡 등 다른 유효한 선택도 바꾸지 않는다.
- 예전 저장/상태에 빈 선택 또는 누락된 `city` 선택이 남아 있으면 위 원래 도시 판정으로 복구한다.
- 설정창 밖의 원래 판정과 `$play_music`의 PLAY·반복·음량·음소거 처리는 그대로다. `city` 항목·과거 형식 변환 기록·음원 파일은 삭제하지 않았다.

새 재생 목록, 거주지 뒤 명성 지역곡 순차 재생, 새 음원, 밸런스·능력치·캐릭터 이름 이관은 이번 범위가 아니다.

## 반영과 검증

- 기준: 최신 WORK/추적 스냅샷 `d566d3e9edcc5fcb47c02a350ea1640340ee316777fbbcd87718aa786357d161`.
- 결과: `2bafb73a7af5423d01493a3e0859064b5846a0f56368c07e9d332ad431830c73`, **50,041,980 bytes / 293 locations**.
- [선언형 패치](../../mods/2026-11-11_city_settings_bgm_keep.json): 1 edit, `#dynamic` 본문 중 해당 선언만 변경. 다른 로케이션과 본문의 나머지는 동일하다. WORK에 공식 `tools/apply_mods.ps1`로 적용하고 추적 QSP·런타임 원장을 맞췄다.
- 실제 FastQSP에서 수정 전 `FAIL music selection` 재현, 수정 후 **120조건 통과**: 소리 켜기/끄기2 × 일반 도시/설정창2 × 이전 선택6(3도시곡·야간·옛city·빈값) × 신분·평판·거주지 조합5. 평판4/5 경계와 귀족 우선, 경로·음량 보존을 포함한다.
- 공식 적용기 재생 결과가 후보와 바이트 동일. 재적용은 쓰기 없이 건너뜀. QSP 왕복·줄바꿈·주석 경계 검사 통과.
- 음원133개와 카탈로그 체크/작업 코드/일정 등 **136개 보호 파일**의 해시를 전후 대조했다. 음원 변경·업로드, Full·배포ZIP·커밋·푸시 없음.

엔진 검사에는 전체 원본 `#dynamic` 정의를 넣고, 진단본에서만 PLAY 한 곳을 경로/음량 관찰로 바꿨다. 실제 음원이 들리는지나 사용자 세이브의 설정 버튼 조작까지 확인한 검사는 아니다. 실제 게임에서는 재실행 후 도시 설정창을 열고 닫을 때 곡이 유지되는지 확인할 수 있다.

## 입출력·호출·유지보수

- 입력: `city_form`, `sound_on`, `$toplay`, `noble_status`, `brand_reputation`, `$estate`. 기존 `$play_music`는 `$music`·`$music_now`·`music_volume`을 사용한다.
- 출력: 설정창의 유효한 음악 선택 유지 또는 빈/옛city 선택의 복구. 숫자 반환은 없고 기존 재생 함수를 호출한다. 다른 게임 상태나 음원 파일은 쓰지 않는다.
- 호출: 도시 화면/도시 이동에서 기존 `dynamic $city_sounds` 경로를 사용한다. 별도 등록·새 타이머·새 지속 변수는 없다.
- 제거: 이 패치를 되돌리면 설정창에서 다시 누락된 city 곡을 선택한다. 다른 BGM 선택 규칙과 음원 형식 변환은 별도다.

## 기록·복구

- [probe.cjs](probe.cjs): 지정한 QSP의 `#dynamic`으로 격리 테스트를 재생성한다. Node.js 내장 모듈과 기존 `tools/text-workshop/core.cjs`, 설치 FastQSP·`tools/qa/run-client-smoke.ps1`에 의존한다.
- [task.cjs](task.cjs): 고정 기준 준비·공식 적용·최종 해시/변경 범위/보호 파일 확인. 일회용 기록이므로 다른 WORK 입력이면 중단한다. 이후 수정이 있으면 자동 되돌림 대신 차이를 먼저 대조한다.
- [prepared.json](prepared.json), [installed.json](installed.json), [verification.json](verification.json)에 백업 경로·전후 해시·보호 파일 목록·결과가 있다. `native-before.json`/`native-after.json`, `replay.log`/`reapply.log`/`apply.log`가 실행 근거다.
- 변경 전 QSP는 Git 밖 `G:/somi/JO9_work_backups/city-settings-bgm-20261111-d566d3e9edcc/before.qsp.gz`로 왕복 검증해 보존했다. 같은 폴더의 원장은 이번 작업 직전 이미지 소스 갱신 등 기존 변경을 포함한다.
- 검증 후 재생성 가능한 진단 QSP·설정 사본·재생 시험본과 준비용 중복 스크립트를 정리한다. 압축 원본·변경 명세·검사 결과·재현 스크립트는 남긴다.
