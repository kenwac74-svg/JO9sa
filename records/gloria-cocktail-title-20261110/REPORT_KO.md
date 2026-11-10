# 글로리아 명주 의상 → 옷 입은 모습 연결

2026-11-10 사용자 지시로 현재 WORK의 `indpack_cocktail`을 `characters/2341_gloria_title`로 바꿨다. 명주 의상을 표시할 때 기존 초록 원피스 타이틀 그림을 사용한다. 현재 비서 그림 `girls/full/secretary/2341_gloria`는 그대로다.

WORK JSON 변경은 이 키 1개뿐이다. 번호·능력치·설명·기본 전신·역할복·초상은 유지했다. source JSON에는 기존 수동 연결 이전의 9개 이미지 키가 남아 있어, 최신 WORK JSON을 복사해 이미 승인된 수동 지정을 보존했다. 해당 수동 PNG 5개는 원본 바이트 그대로 소스에 보존하고 runtime 원장에 등록했다. 게임 PNG는 편집·교체하지 않았다.

게임은 착용 의상 `cocktail_dress`에서 `indpack_cocktail` 등록을 조회한다. 기존 `display_fullimage`와 `jo9_seed_role_images`의 조회 로직은 변경하지 않았다. JSON 등록 캐시는 EXE를 완전히 종료하고 다시 실행한 뒤 확인한다.

검사: JSON 파싱·WORK 변경 키 1개·소스와 WORK 동일·PNG 5개 파일 열림/크기/해시·runtime 등록 6개(JSON 1+PNG 5)·QSP 동일을 확인했다. 실제 게임 화면은 사용자가 기존 세이브에서 글로리아에게 명주 의상을 입혀 초록 원피스가 나오는지 확인한다.

복구: `work.before.json.gz`와 `source.before.json.gz`는 서로 달랐던 수정 전 JSON을 각각 보존한다. `inventory.before.json.gz`에는 기존 미커밋 안정성 수정도 포함되어 있다. 후속 수정이 있으면 전체 복원을 하지 말고 필요한 키/원장 항목만 대조한다. 새로 보존한 소스 PNG는 WORK 원본과 동일한 사본이므로 단순 중복이라는 이유로 삭제하지 않는다.

QSP·세이브·Full·음원은 수정하지 않았다. 배포·커밋·푸시는 하지 않았다.
