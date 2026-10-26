# 이사벨라 일일 알림의 옛 외형 — WORK 수정

패치 ID: 2026-10-23_indie_event_fullimage. 2026-10-23 사용자 보고에 따른 기존 외형 교체 누락 수리.

## 원인과 실제 변경

화면은 end_day_screen의 조수 굶주림 경고다. 조수의 fullimage를 배경 경로로 읽을 때 기존 jo9_seed_role_images가 도나 충돌 ID2577~2601만 처리하여 이사벨라2571의 옛 후드 이미지가 그대로 반환됐다. 일반 개인실 display_fullimage는 이미 indpack 이미지를 선택했으므로 정상 화면과 이벤트 화면이 달랐다.

현재 JSON의 legacy fullimage와 fullmade/fullsecretary/fullmistress는 구 경로를 유지하고 indpack_*에 새 팩을 등록한다. 또 assistant_stat의 역할 선택은 fullimage 자체에 세 역할 별칭을 복사한다. 이미지 파일을 덮거나 인스턴스를 이관하는 대신 공용 resolve 한 블록만 보완했다.

## 입력·출력·부작용

- 입력: func('jo9_seed_role_images','resolve',인물ID,저장된그림경로,'fullimage'). 기존 인자와 호출부는 그대로다.
- 비어 있지 않은 저장 경로가 해당 ID의 현재 등록 fullimage와 정확히 같으면 indpack_title을 반환한다. fullmade/fullsecretary/fullmistress와 정확히 같으면 각각 indpack_maid/secr/dom을 반환한다. 역할 팩이 없으면 그 ID의 indpack_title, 이것도 없으면 원래 경로와 기존 도나 처리로 이어진다.
- fullimage 이외의 명시적 역할 요청, 알 수 없는 ID, 다른 사용자 지정 경로, 빈 경로는 새 분기에서 바꾸지 않는다. 등록 파일과 같은 경로를 의도적으로 지정한 경우는 기존 기본값과 구분할 수 없으며 같은 우선 규칙을 따른다.
- 함수의 문자열 반환만 바뀐다. 저장된 인물 배열·fullimage·ID·세이브·JSON·이미지·게임 수치는 쓰지 않는다. 이미 선언된 local 임시 변수만 사용한다. 새 QSP location/함수/영구 상태 키/로드 이관은 없다.
- 새 이사벨라2571과 구 랜덤 이사벨라2323은 각각 자기 ID의 팩을 쓴다. 2323 및 공유 legacy 이미지 파일을 지우거나 덮어쓰지 않았다.
- 기존 display_fullimage의 복장·기분 우선 선택과 기존 도나 충돌 보정은 유지한다. 일반 전신 fallback을 사용하는 display_pic·일일 알림·미리보기 등 기존 호출부42줄이 같은 조회 함수를 공유하며 호출 코드는 수정하지 않았다.

## 의존성·부분 복구

의존성은 기존 refresh_database의 fullimage/fullmade/fullsecretary/fullmistress 및 indpack_title/maid/secr/dom 등록과 실제 이미지 파일이다. 등록이 없으면 원래 경로를 유지하므로 인디팩 없는 설치도 기존 동작으로 남는다. 변경 위치는 jo9_seed_role_images의 INDIE_EVENT_FULLIMAGE_20261023 시작/종료 표식이다.

이 블록만 제거하면 조회 시 새 팩을 고르는 보정이 사라져 같은 알림에서 옛 이미지가 다시 나올 수 있다. 기존 helper 전체를 제거하면 그 함수를 쓰는 원래 도나 충돌 해결과 소비처도 깨지므로 전체 삭제로 복구하지 않는다. 재현은 mods/2026-10-23_indie_event_fullimage.json 한 파일과 기존 tools/apply_mods.ps1을 사용한다.

## 검증

- 기존본에서 실제 엔진 오류 재현: event_0 및 alias_0이 잘못된 그림 선택으로 실패했다. 문법 오류가 아닌 의도된 assert 실패다.
- 최종 후보207사례 통과: 일일 알림18개 경로×인물6명=108, 실제 굶주림 분기12, 기본·역할 별칭/사용자 경로/빈 경로/팩 미등록/도나 회귀29, display_pic16, 정상 및 비활동 HTML42.
- 인물6명은2571/2323/1132/2057/2118/1160. ID·상태·검사용 보존값·기본 경로 보존을 함께 검사했다. 실제 조회 함수 본문은 진단 사본에서도 그대로이고 Start 및 격리 호출용 demo_estate만 교체했다.
- 공식 출고: 구조263 location, 왕복 바이트/줄·주석 경계, 정확 패치 재생·멱등성, JSON1,126개 충돌0, 필수 실제 엔진9경로 PASS. 독립 검수에서 한 location만 변경되고 이전 노예근성 구현 및 기존 도나 정리 구간이 그대로임을 확인했다.
- 기존 save57개, 인물 JSON1,126개, Full QSP 해시 보존. 검사한 이미지의 존재 여부와 기존 파일 해시도 보존했다. 일부 인디팩 인물의 미사용 legacy 별칭은 원래 파일이 없으며 이를 생성하거나 이미지 손실로 새로 집계하지 않았다. 실제 선택하는 indpack 파일은 모두 존재한다.
- 실제 화면 픽셀, 저장 선택 UI/전체 저장 스크립트 복원, 모든 하루 종료 사건을 순서대로 플레이한 검사는 아니다. 경로 선택과 발췌한 실제 굶주림 분기의 텍스트·플래그·장소를 실제 엔진에서 검사했다. 이미 실행 중인 게임은 종료 후 최신 WORK QSP로 다시 시작해야 한다.

## 반영·보관

WORK/game/jack.qsp만 반영. Full/배포 ZIP/커밋/푸시 변경 없음. 다음 패치 작업묶음에 적용 완료·미배포로 추가했다.

- 이전 SHA256: daa953cd391d8268a57724d27b54194e71378dc9ef54ad1e79279cce6897d7db
- 적용 SHA256: 5aeff11fffe6e5f2523749987577f42dab870f4d0adee0df385375f9eefb074f
- 최소 복구본: G:/somi/JO9_work_backups/isabella_event_image_20261023/before.qsp.
- 기록: candidate-summary.json, release-validation.json, red/green-results.json, green-coverage.json, independent-review.json, scripts/.
- 검사 QSP·복제 JSON·중복 백업은 보고서와 재현 스크립트 보관 후 정리한다.
