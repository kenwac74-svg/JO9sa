# 에게야 역할 이미지 최종 수정

기준 QSP: c6701e3ab130b1a762d0b1a523d52cd53cee846f71c3d7899a4c369389aa853d. 조각: 0935928f0786994e497843195f8602041f961b140047c41c638f1d02371f0d76. 초기 조각은 edits-pre-review.json에 보존하며 로드순서 결함으로 대체됐다.

원작2577~2601에 남은 구 도나 역할 문자열96개만 식별한다. 원작25명 JSON의 역할값은 누락/빈값이므로 일치한 전역 역할값만 빈값으로 정리한다. 정상8877~8901은 대상이 아니다. 에게야의 전용 역할 CG는 추가하지 않는다.

초기 헬퍼는 actor 역할/fullimage 캐시까지 즉시 바꿨다. 로컬 엔진 소스의 저장복원→ONGLOAD→JSON 순서에서는 이 변경이 식별값을 지워 이후 새 기본/사용자 역할 이미지 등록을 놓쳤다. 초기 헬퍼의 native 검사에서 새 기본·새 하녀 두 경우의 실패를 재현했다.

최종 헬퍼는 actor 문자열을 쓰지 않는다. 옛 역할 경로를 식별 가능한 상태로 남기고 그림을 읽을 때 현재 전역값으로 반환한다. 일반 fullimage 읽기는 현재 기본 전신, 역할별 읽기는 현재 해당 역할이 있으면 그 경로, 없으면 기본 전신이다. 사용자 경로·범위 밖 ID·일반 구 도나 기본 전신은 입력 그대로다. 잘못 영입된 개체 자체를 교체하지 않는다.

GS 'jo9_seed_role_images': $ongload/$newloc 시작의 두 호출. 인수/반환 없이 정확히 일치한 전역 역할96개만 정리한다.

FUNC('jo9_seed_role_images','resolve',type,cached_path,key): 문자열 반환. key는 fullimage 또는 fullmade/fullsecretary/fullmistress/fullpregnant. 원작ID와 검증된96경로가 모두 일치해야 현재 role/base를 반환한다. resolve의 부작용은 LOCAL뿐이며 actor·전역표·revision을 쓰지 않는다. 이름·능력치·육성·관계·장비·복장·image_mode는 보존한다.

구조는 헬퍼1개(72줄), 기존10로케이션의 grouped edit36개다. 훅2개, display_fullimage의 최종경로 판정1개, 직접 소비41줄/42식이다. 소비 위치: end_day_screen, interaction_screen_city, stasis_cell, display_pic fullimage getter, interaction special_action, interaction_city special_image, sex_interaction_result. 상태를 쓰는 hairColor/hairLen 추정은 그대로다. 모든 변경문에 JO9 MOD START/END EGEYA_STALE_ROLE_IMAGES_20261022를 두었다. consumer-inventory.json에 원문·변경문·기준/후보 행을 기록했다.

헬퍼를 제거하면 호출부도 함께 분리해야 한다. 호출만 제거하면 남아 있는 raw actor 옛 경로가 다시 보일 수 있다. 전역 역할 정리는 다음 사용자 저장에 포함될 수 있지만 세이브 파일은 직접 쓰지 않는다. raw actor 경로를 남기는 것은 최신 JSON을 읽을 수 있게 하는 의도된 동작이다. 같은 원작ID에 같은 검증 경로를 일부러 지정한 경우 잔류값과 구별할 표식은 없다. 원래 pregnant 키가 없던2585/2597/2600/2601은 경로를 추측하지 않는다.

검증: 초기 방식의 ordering RED2건, 최종 조각13/13 및 실제 통합 후보13/13 native 통과. 후보 SHA-256: baaa39836b905e748a6ec8f356494b0260160a364164bc3684812394e4a9dbc9. 기본/하녀/비서/도미나/임신 fallback, 원작25·96문자열·32슬롯 보존·정상 고번호25·사용자 경로, ONGLOAD 조기gt/중첩newloc 뒤 fresh JSON base/role, 직접 소비41줄의 실제 주석·따옴표·치환·동적실행을 포함한다. 100회 전역검사+3200회 resolve도 완료했다. 얇은 패치 구조/CRLF/마커/재생/멱등성 검사는 STATIC_PASS. 전체 통합 출고는 상위 작업의 별도 보고서다.

재현에는 test-egeya.cjs/mapping-inventory.json/edits-pre-review.json을 같은 폴더에 둔다. red-order는 기준QSP에 초기 조각만 메모리로 적용하여 두 실패를 확인한다. green은 기준QSP에서 최종조각을 생성/검사한다. integrated는 정확한 후보 해시를 필수 인수로 받고 실제 들어간 코드만 읽으며 훅을 다시 넣지 않는다.

명령: node test-egeya.cjs <출력폴더> red-order <기준QSP>; node test-egeya.cjs <출력폴더> green <기준QSP>; node test-egeya.cjs <최종조각폴더> integrated <후보QSP> <후보SHA256>.

실제 세이브 선택UI, 최초 복원 HTML 육안확인, 전체 영입/승격은 수행하지 않았다. 로컬 소스와 설치 바이너리 동일성은 단정하지 않고 해당 순서를 명시적으로 재현했다. 진단 QSP/로그/중복 재생본은 결과 포착 후 정리했다. 이 하위 작업에서 Work/Full/JSON/이미지/세이브/ZIP/커밋/푸시 변경 없음.
