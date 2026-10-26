조사만 수행했다. 게임·JSON·이미지·세이브 변경, 엔진 실행, UI 재현은 하지 않았다.

기준: WORK `jack.qsp` SHA-256 `be2c993d24911fec5edfc0efceee9d4bd570c2d9e3a511975a69e29e383ba898`, 273 locations.

| 확정 대상 | 현재 참조 | 같은 폴더의 실제 파일 | 판정 |
|---|---|---|---|
| `json/slaves/212.json:8`, `seed_ava_clear` | `content/pic/girls/face/00212_white_long_loli` | `0212_white_long_loli.png` | 맨 앞 0이 한 개 많아 파일 참조 불일치 |
| `json/slaves/178.json:3`, `fullmade` | `girls/full/cloth/178_purple_short_loli` | `0178_purple_short_loli.png` | 맨 앞 0이 한 개 부족해 파일 참조 불일치 |

WORK의 slave JSON 1,126개에서 이미지 경로 문자열 9,780개를 검사했다. 같은 디렉터리에서 숫자 앞 0만 달라지는 누락 참조는 위 2개다. 전체 누락 경로를 전부 버그로 세지 않았다. 독립팩의 대체 경로와 역할 이미지 처리 등이 있기 때문이다.

212의 `fullimage`는 `girls/full/0212_white_long_loli`이고 해당 전신 PNG가 있다. sepia와 gray 얼굴 경로 및 파일도 일치한다. 212 사례의 확인된 오류는 clear 얼굴 1필드다. 사용자 예시의 `_lol`이라는 정확한 철자는 확인되지 않았으며 실제 접미사는 `_loli`다. 카탈로그도 `0212_white_long_loli`를 사용하며 `00212_white_long_loli` 항목은 확인되지 않았다.

WORK와 Kor_Full의 위 두 JSON 및 실제 대상 PNG는 각각 SHA-256이 같다. 보관 원본 `G:/somi/JO9O/game/json/slaves/178.json`은 `fullmade`에 정상 `0178_purple_short_loli`를 사용한다. 원본 212는 `0212_red_short_loli` 계열이며 모든 얼굴 경로가 정상 `0212`다. 따라서 현재 두 오기를 보관 원본의 동일 버그라고 분류할 근거는 없다.

178은 현재 기본 전신·얼굴이 `0178_blue_long_loli`인데 `fullmade`는 purple_short를 가리킨다. 실제 cloth 폴더에는 `0178_purple_short_loli.png`만 있다. 숫자 0 누락은 확인됐지만, 의상 그림 선택 자체의 의도는 별도 확인 사항이다. 색상·머리길이까지 임의 변경할 근거는 없다.

현재 QSP의 경로 전달 근거(모두 location 내부 1-based 줄 번호):

- `get_stock_seed:294-297`: 전신과 세 얼굴 경로를 seed 배열에서 `$stock` 이미지 캐시로 복사한다.
- `get_demo_slave:159-162`, `get_special_slave:169-172`, `get_special_assistant_quest:382-385`: 각 actor 캐시에 동일한 방식으로 복사한다.
- `#dynamic:5069-5078`의 `$plastics_confirm_appearance`: 선택한 외형의 네 이미지 경로를 `$dynslave`에 복사한다.
- `main_screen:381`: `$slave['ava_clear']`에 `.png`를 붙여 직접 `<img src>`에 넣는다. `main_screen:276`은 assistant의 같은 방식이다. 얼굴 참조에 숫자 0을 정규화하는 호출은 없다.
- `assistant_stat:189-194`: `fullmade`가 비어 있지 않으면 메이드 표시 선택지를 제공하고 선택 시 `$assistant['fullimage']`에 복사한다.
- `display_fullimage:104,106-109,133`: 역할 resolver와 indpack 경로 선택을 거친 후 `content\\pic\\` 및 `.png`를 붙인다.
- `jo9_seed_role_images:38-78`: indpack 기본/역할 별칭과 2577~2601의 알려진 역할 경로를 처리한다. 178·212의 숫자 0 오기와 clear 얼굴을 처리하지 않는다.
- `$ongload:38-50`: 알려진 역할 경로와 예전 SNKmod 장면 캐시 접두사 처리만 있다. 두 오기의 actor 이미지 캐시 수정은 없다.

세이브 영향: actor의 `ava_clear`/`fullimage`는 seed 경로를 복사한 별도 문자열이다. JSON만 고친다는 가정으로 기존 actor 캐시까지 자동 수정됐다고 판단할 수 없다. 현재 코드상 잘못된 값이 남아 있을 수 있으므로 기존 세이브를 포함한 수정에는 알려진 정확한 이전 경로만 처리하는 호환 검토가 필요하다. 이번 조사에서는 세이브를 읽거나 고치지 않았다.

정적 파일 참조 불일치는 확정했다. 실제 렌더링 증상과 엔진 JSON 적재 순서는 실행 검증하지 않았다. 이미지 이름 일괄 정규화나 파일명 변경은 제안하지 않았다.

재현: `node audit-leading-zeros.cjs "G:/somi/Jack O Nine Tails v2.4_work/game"`. 이 스크립트는 읽기만 하며 누락 경로와 동일 디렉터리의 숫자 0 차이 후보만 출력한다.
