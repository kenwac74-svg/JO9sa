# 에게야 옛 fullimage 캐시 후속 — 읽기 전용

**현재 한 줄 수정은 재현된 조수 알몸 선택 문제에는 충분하다. 옛 캐시의 직접 fullimage 조회 제한까지 모두 없앤 것은 아니다. 다만 옛27의 raw globals가 비었다는 사실만으로 실제 로드 후에도 알몸 그림이 잘못 나온다고 판단할 수 없다.**

현재 WORK SHA는 `f6520ef11a720f6d15127738032be960acc1153eb653e2760495b880e85cef97`이며, 앞선 `tests/matrix-candidate-results.json`의 실제 native 후보와 같다. 기존 결과와 현재 QSP를 읽어 대조했으며 추가 엔진·대형 복사·저장 변경은 하지 않았다.

읽은 옛27은 `game/save/JO9_MANUAL_20261025/02_수동확인_문제재현/27_private_reports.sav`, SHA `e0c874b89fc1935e505264d0df53c2e8bc578eda60fb5284b928dd773951ab35`다. raw 상태의 주노예·room1은 type2579/age2/cloth=`голая`, actor fullimage=`girls/full/maid/kirakira`다. 전역 fullimage는 egeya base이고 title/naked 배열 값은 비었다. 이는 **로드 전 파일 관찰**이며 이후 JSON 재등록 결과가 아니다.

확인한 QSP 로드 경로는 `$ongload:115`의 `saved_game_loaded=1` → `$newloc:111–113`의 `$addon,'update','full'` → `$addon:9–11`의 interior 저장·`refresh_database`·interior 복원이다. `refresh_database:18–58`은 QSP 정의를 다시 읽는다. 이 일반 경로에서 인물 fullimage를 현재 전역값으로 덮어쓰는 호출은 없다. 실제 actor를 덮어쓰는 `$addon_custom_data:270`은 별도 `update_current/update_active` 경로로, 일반 update full과 다르다. `jo9_seed_role_images:81–89`의 정리도 정확한 옛 **전역 역할값**만 지우며 actor 캐시는 유지한다. 실제 엔진의 JSON 등록 순서·완료 여부와 옛27의 실제 LOAD는 이번에 검증하지 않았다.

| 현재 JSON globals가 정상 등록된 뒤의 조건 | 확인 결과 |
| --- | --- |
| 옛 캐시 + 실제 알몸 복장, 일반 `display_fullimage` | 현재 `indpack_naked`가 fallback base보다 우선한다(`display_fullimage:108–130`). 기존 native slave/assistant 사례는 새2579 naked 정상. 같은 generic 경로인 room1도 소스상 동일하다. 따라서 옛27의 현재 복장에서는 일반 전신 표시 문제가 지속된다고 단정할 근거가 없다. |
| 옛 캐시를 `resolve(...,'fullimage')`로 직접 조회 | globals가 정상이어도 old base 반환. `jo9_seed_role_images:61–74`는 옛 역할 경로를 인식한 뒤68행의 `$fullimage[id]`를 돌려주며 title로 다시 해석하지 않는다. 현재 hash의 기존 native 결과로 확인했다. `display_pic:77/90/157`은 이를 바로 반환한다. |
| 옛 캐시 + 팩에 없는 옷의 일반 전신 표시 | sun_dress 등 해당 indpack 값이 비면 위 fallback base가 그대로 남을 수 있다. 현재 native 결과에서도 유지된다. 옛27에서 관찰한 복장은 이 조건이 아니다. |
| 알몸 버튼을 다시 선택한 조수 | 버튼이 actor fullimage를 현재 기본 별칭으로 바꾸고 현재 한 줄 수정이 `fullimage` 키로 조회하므로 title/naked가 선택된다. 이미 검증된 해결 범위다. |

따라서 **QSP update full만으로 옛 actor cache가 자동 교체된다고 볼 수는 없지만, 캐시 잔존과 실제 오표시는 구별해야 한다.** 일반 naked 표시에는 후속 indpack 우선 처리가 있고, 직접 조회·없는 복장 fallback에는 별도 제한이 남는다. raw 배열 부재를 근거로 실제 로드에서 globals 갱신이 실패했다고 주장하지 않는다.

별도 수정을 승인한다면 가장 작은 범위는 기존 resolver의 **type2579 + 이미 legacy로 인식하는 정확한 kirakira 역할 경로 + 요청키 fullimage**에서, 현재 title이 있을 때 그 title을 반환하는 읽기 보정이다. title이 없으면 기존 base fallback을 유지하고, 다른 ID·명시한 역할키·등록된 정상 경로·그 밖의 custom 경로는 그대로 둔다. actor 문자열·SAV·전역값의 일괄 치환이나 새 영구키는 필요 없다. 이것은 제안만이며 구현하지 않았다.
