# 고유 인물의 일반 무작위 생성 차단

2026-11-17 사용자 지시. WORK와 추적 소스에 반영했다. 현재 QSP SHA256: `5b344a0e0bd1411d0e0c45b16c6b319b1588a138f34edd542821cf9c361eb368`.

## 확인한 사실

전체 JSON1885개를 대조했다. 이름이 있다는 이유만으로 유니크라고 판정하지 않고 획득 목록과 반복 템플릿의 용도를 대조했다. 고유 인물·상태 변형 프리셋92개, 일반 템플릿1792개, 작성용0_template1개로 구분한다. 일반에는 반복 민족12개·농장6개·고정 그림 팩27개·MOB분리728개가 포함된다. 1450은 기존 미등록 호환 제외를 유지한다.

글로리아2341 JSON에는 무작위 차단 설정이 없지만, 현재 생성기는 그런 JSON 항목을 읽지도 않는다. 현재 정상 범위의 milf 상한2340과 추가 MOB4440~4727에는 글로리아2341이 없다. 다른 JSON의 글로리아 그림 참조도 없다. 따라서 새 제보가 발생한 실제 세이브에서 어떤 경로였는지는 확정하지 않았다. 이번에는 범위가 넓어진 예전 저장값에서도 고유 ID가 일반 추첨으로 들어가지 못하도록 명시적인 공통 차단을 추가했다.

`unique_slave`는 획득 이력이며 완전한 고유 목록이 아니다. 도구의 random 표시는 번호 범위 판정이라 고유 분류 근거로 사용하지 않았다. 일부 변형의 직접 경로가 과거 획득 스냅샷에 없다는 것은 미구현 판정이 아니다. 기존 명시적·퀘스트·상태 변형 경로는 모두 보존한다.

## 적용

새 순수 helper `jo9_random_stock_allowed`는 검증한92개와 기존1450을 차단하고, `generate_stock`의 일반 추첨과32회 뒤 대체 선택에서 같은 helper를 사용한다. 기존32회 상한과 생성 후반 코드는 그대로다. 직접 지정 `special_stock`와 튜토리얼/고유 영입 경로는 필터 밖에 유지했다. 일반 안개 보상·노예시장·경매 등 공통 생성기 호출에 적용된다. JSON·능력치·특성·가격·개인 세이브 파일은 수정하지 않았다.

저장 배열·캐릭터별 표시값을 추가하지 않아 새 세이브 이관이 필요 없다. 게임 재실행 후 새 추첨부터 적용된다. 이미 생성된 시장 재고·전리품이나 보유 인물은 삭제하거나 바꾸지 않았다. 새로운 유니크를 추가할 때에는 이 검증 ID 목록을 갱신해야 한다.

## 검증

실제 QSP WASM5.8에서 선택 구간과 helper를 실행했다. 고유/호환93개 차단, 일반1792개 전부 허용, 넓은 캐시2341을 강제 추첨해도32회 뒤 정상4440 대체 선택, 명시적 지정93개 유지와 기존 생성 후반/다른 위치 보존을 포함해2300확인을 통과했다. 이는 선택 구간과 일부 바이트 비교의 합계이며 전체 캐릭터 생성·퀘스트 영입 플레이·제보 세이브를2300번 실행한 뜻이 아니다.

함께 적용한 목걸이 조건은 독립9조건을 통과했다. 합친 QSP의 두 본문은 각각 검증한 후보와 동일하며, 추가 helper외 다른 위치/필드는 그대로다. 직렬화 왕복·역변경·변경 범위 마커/CRLF·공식 최소mod dry-run도 확인했다. 전체 배포 검사는 반복하지 않았다. Full/ZIP/커밋푸시 없음.

## 보존과 재현

`blocked-unique-ids.json`은 ID별 분류 근거와 일반 템플릿 보존 목록이다. `generator-stage.cjs`와 `test-generation.cjs`는 이 목록으로 후보와 중립 검사를 재현한다. 정확한 게임 변경은 mods의 2026-11-17_unique_random_filter.json과 2026-11-17_humility_worn_shock_collar.json 두 patch다. `apply.cjs`는 최신 입력과 검증 후보를 대조하고 통합한다. 제거할 때는 생성기의 두 gate와 helper를 함께 검토하며, 이후 수동 원고가 있는 전체QSP를 과거 파일로 덮어쓰지 않는다.

## 차단하는 고유 프리셋

|번호|이름|JSON|
|---:|---|---|
|1448|시루|1448_Shiru.json|
|2339|야기슈나|2339_yagisuna.json|
|2341|글로리아|2341_Gloria.json|
|2571|이사벨라|2571_isabella.json|
|2572|펠리시티|2572_felicity.json|
|2573|빌헬미네|2573_wilhelmine.json|
|2574|야즈민|2574_yasmin.json|
|2575|헬렌|2575_helen.json|
|2576|줄리아|2576_julia.json|
|2577|펠라게야|2577_pelageya.json|
|2578|미라|2578_mira.json|
|2579|에게야|2579_egeya.json|
|2580|마르셀리나|2580_marselina.json|
|2581|마리로즈|2581_marirose.json|
|2582|레이첼|2582_rachel.json|
|2583|갈라테야|2583_galateya.json|
|2584|베네라|2584_venera.json|
|2585|펠라게야|2585_pelageya.json|
|2605|뱀피렐라|2605_vampirella.json|
|2606|베네라|2606_venera2.json|
|2607|펠라게야|2607_pelageya2.json|
|2608|마르셀리나|2608_marselina.json|
|2609|미라|2609_mira.json|
|2610|바실리사|2610_vasilisa.json|
|2611|스네구로치카|2611_snegurochka.json|
|2612|매들린|2612_madelyn.json|
|2613|캐롤라인|2613_carolina.json|
|2614|스네자나|2614_snezhana.json|
|2615|잔나|2615_zhanna.json|
|2616|엘사|2616_elsa.json|
|2617|자스민|2617_jasmine.json|
|2618|소냐|2618_sonya.json|
|2619|밀린티나|2619_milintina.json|
|2620|라나|2620_lana.json|
|2621|캬루|2621_kyaru.json|
|2622|젠제|2622_sense.json|
|2623|프리렌|2623_friren.json|
|2624|엘자|2624_erza.json|
|2625|로즈|2625_rose.json|
|3001|츠키|3001_Tsuki.json|
|3002|루미너스|3002_Luminous.json|
|3003|알베도|3003_Albedo.json|
|3004|알파|3004_Alpha.json|
|3005|페른|3005_Fern.json|
|3006|프레이야|3006_Freya.json|
|3007|히비키|3007_Hibiki.json|
|3008|미쿠|3008_Miku.json|
|3009|미사키|3009_Misaki.json|
|3010|리아스|3010_Rias.json|
|3011|사다코|3011_Sadako.json|
|3012|에키드나|3012_Echidna.json|
|3013|샤크티|3013_Shaakti.json|
|3014|시노부|3014_Shinobu.json|
|3015|사야카|3015_Sayaka.json|
|3016|입실론|3016_Epsilon.json|
|3017|위즈|3017_Wiz.json|
|3018|요르하|3018_Yorha.json|
|3019|라프타리아|3019_Raphtalia.json|
|3020|마유미|3020_Mayumi.json|
|3021|다이아나|3021_Diana.json|
|3022|힐다|3022_Hilda.json|
|3023|이리스|3023_Iris.json|
|3024|알렉시아|3024_Alexia.json|
|3025|아키라|3025_Akira.json|
|3026|검의 처녀|3026_Sword_Maiden.json|
|3040|춘향|3040_chunhyang.json|
|8877|메디코|8877_medico.json|
|8878|포르노|8878_porno.json|
|8879|키라키라|8879_kirakira.json|
|8880|츠이나|8880_tsuina.json|
|8881|야미|8881_yammy.json|
|8882|안테나|8882_antenna.json|
|8883|아리스|8883_alyce.json|
|8884|미스트레스|8884_mist.json|
|8885|조커|8885_joker.json|
|8886|이누이|8886_Inui.json|
|8887|시온|8887_zion.json|
|8888|린|8888_rin.json|
|8889|키쿠치요|8889_kikuchiyo.json|
|8890|리리에|8890_Ririe.json|
|8891|쿄카|8891_Kyoka.json|
|8892|노에루|8892_Noelle.json|
|8893|미루키|8893_Miruki.json|
|8894|타마키|8894_Tamaki.json|
|8895|치하루|8895_Chiharu.json|
|8896|후미|8896_Fumi.json|
|8897|사나|8897_Sana.json|
|8898|나나미|8898_Nanami.json|
|8899|슈코|8899_Shuko.json|
|8900|셀레스틴|8900_celestine.json|
|8901|올가|8901_Olga.json|
|8902|라이스 샤워|8902_RiceShower.json|
