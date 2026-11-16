<!-- NIGHT_REFRESH_20261113:START -->
## 최신 갱신 우선

현재WORK/추적QSP/원장 `348e5e27990db9d01a6490b433cb3a396993337f24d8df3625e24da04e6f110a`. 아래 최초2ad5be48 감사와 중간수정 기록은 당시 근거다. G01·승인G03(R03-1~9)은 반영 완료. G02·G04는 실제엔진 표본관찰까지 했으나 새수정은 승인대기다.

수동JSON19·미등록이미지후보117·수동참조60·옛9경로·크기차이29로 갱신했다. [최신 보고](<G:/somi/JO9sa/records/release-night-preflight-20261113/REPORT_KO.md>)와 [리소스 근거](<G:/somi/JO9sa/records/release-night-preflight-20261113/RESOURCE_REVIEW_KO.md>)를 우선한다. 공식출고PASS/Full포장/이관완료는 아니다.
<!-- NIGHT_REFRESH_20261113:END -->

# 2.4.2 Full 빌드 전 누락·정합성 감사

기준2026-11-13 WORK `2ad5be48346be378983ca0eb018067eb358b5a347b6863ff8c37bb1071f13d30`. **출고 미완료.** 코드·기록·메타데이터/표적해시 감사 결과다.

[배포 기준 상세](<G:/somi/JO9sa/records/release-prep-20261113/BASE_AUDIT_KO.md>) · [기능·보류 상세](<G:/somi/JO9sa/records/release-prep-20261113/CODE_AUDIT_KO.md>) · [리소스 상세](<G:/somi/JO9sa/records/release-prep-20261113/ASSET_AUDIT_KO.md>) · [세이브 이관 사전 점검](<G:/somi/JO9sa/records/release-prep-20261113/MIGRATION_PREFLIGHT_KO.md>)

## R02 완료 후 상태

2026-11-13 조커 구매 키/저장 메뉴/거래 입구 수정과 실제 엔진106검사를 완료했다. 현재 WORK는 `f03580b7d55d7100fe29e5ce1a2f9c8cb4bc8dd6bc1323478a89579a8073d14e`. 아래는 최초2ad5be48 감사의 근거를 보존하며 G01은 해결됐다. [R02 상세](<G:/somi/JO9sa/records/release-r02-joker-20261113/REPORT_KO.md>)

## 먼저 검토할 기능 잔여

### G01 조커 재구매 차단 플래그 불일치

- 상태: R02 수정·실제 엔진 검증 완료. 아래 위치/불일치 근거는 수정 전 감사 기록이다.
- 위치: #options:$KulaShop_options[2]:4216 및 interaction_city:6244:12241
- 근거: 동적 실행 메뉴 if jokr = 0; 구매 본문 joker = 1. 둘 다 주석이 아니다.
- 기록: [상세](<G:/somi/JO9sa/records/dohna-stats-20261112/REPORT_KO.md>)

### G02 반복 구매자 목표·문의 상태 미연결

- 상태: 현재 본문 문자열/기존감사 대조;미수정
- 위치: slave_sell_chek 및 interaction_city2992/9992/9995
- 근거: slave_sell_chek에서 anes/ermelinda/noemi/Elisabet_1..5 일치0. 별칭/다른상태로 전반 동작을 재현한 검사는 아니다.
- 기록: [상세](<G:/somi/JO9sa/records/handoff-gap-audit-20261112/REPORT_KO.md>)

### G03 요구·선호 콜백의 비교 연산자 잔여

- 상태: 현재 본문 확인;수정/실행검증 없음
- 위치: #npc_base:3926~3941(kikimora),5459~5472(Artemia);추가3881~3894(leshiy)
- 근거: kikimora stat_importance8줄 > 및 min_beauty >; Artemia9줄 > 및 min_beauty >. 추가 leshiy sensitivity < 4,min_stamina > 3도 있음. 실행되는 저장 동적콜백의 코드이며 주석이 아니다. 모든 선호를 필수조건으로 승격하는 수정은 미승인.
- 기록: [상세](<G:/somi/JO9sa/records/handoff-gap-audit-20261112/REPORT_KO.md>)

### G04 일반 노예 반말 제외 방침과 공용 tone3 경로 차이

- 상태: 사용자 결정 대비 현재 실행콜백 차이;수정 미적용
- 위치: #dynamic:$voice_profile:5222~5252,특히5244~5247
- 근거: 11개 직업 목록은 지정8명 여부와 별개로 tone_code3을 선택한다. 다음줄 지정8명 예외를 추가하며 마지막에결과반환. 주석이아닌 {$voice_profile} 실행코드.
- 기록: [상세](<G:/somi/JO9sa/docs/SLAVE_DIALOGUE_ASSEMBLY_RULES_CURRENT_20261112_KO.md>)

### G05 신규·변경 저장 상태 최종 이관 도구

- 상태: D21:2.4.2 Full 배포 직전 개발 보류
- 위치: deferred-discussions D21
- 근거: 인물 기본이름(같은ID+옛기본이름일때만),이미지경로/캐시,임시시루별칭;랠리/신의상/춘향/도나revision/PR17B4필드보존도 최종검토 필요. 지금미구현을 버그수정누락으로 표현하지 않는다.
- 기록: [상세](<G:/somi/JO9sa/records/deferred-discussions-20261024/index.json>)

## 리소스·포장 위험

1. 수동JSON17과2339_yagisuna 명명본은 WORK가 현재 기준이다. 소스의 옛파일로 덮거나 같은ID 두정의를 함께 배포하지 않는다.
2. 원장 밖101이미지는 모두WORK에 있다. 그중 직접JSON참조50의38신규/10교체는 최종 입력 보존 후보다. 실제 Full을 아직 만들지 않아 ZIP누락이라고 부르지 않는다.
3. 원장 부재9·크기차이27은 승인된 교체/퇴역과 세이브 호환을 대조해야 한다. 호환23개와 시루·2071의 검증된 주소는 임의삭제하지 않는다.
4. game전체45630파일과본편game42926의metadata차이는신규2773/크기차이991/부재69다. 동일크기의내용차이는이번전수검사범위밖이며최종Full SHA대조에서확인한다.
5. 원장밖2524에는도구2403·그중개인편집상태1865가포함된다. 개인SAV/설정/아이디어/후보/백업을공개배포로복사하지않는다.
6. 게임음원136개를단순전부복사할지결정한것은아니다. 호출/원본보존/형식에따라필수파일을정하고,Git바이너리업로드금지와게임배포를구분한다.
7. WORK상위에는구2.4.1안내HTML/README/INSTALL/manifest가남아있다.2.4.2Full의실행기/엔진/설치흐름/버전표시/문서는새최종명세로대조해야한다.

## 코드 이력 대조의 한계

308행/46절/118mods는범위가겹치는이력이다.773편집중669정확일치외104는후속교체33·전체본문계보및조각추적9·개별조각최종60·그림핵심블록2로현재근거에모두연결했다.이는대상변경의코드잔존/후속대체감사이며모든게임분기나최종출고PASS는아니다.후속상세CODE_AUDIT_KO.md및code-audit-data.json을우선한다.

## D21 마지막 단계

2.4.2Full이확정돼이관준비를포함한다.그러나모든수정·이미지경로정리후최종매핑을고정한다는사용자조건을지킨다.기존작명/육성/관계/퀘스트/장비/소유일과이미승인된도나1회갱신은보존하고,원본SAV를직접덮지않는도구·반복/실패/복구/CRC와실제UI로드를검증해야한다.

## 변경 경계

이번준비감사에서게임QSP/JSON/이미지/음원을수정하거나기존Full폴더/개인SAV를바꾸지않았다.직전춘향수정은별도기록으로완료됐다.포장·설치·마이그레이션구현·커밋·푸시·공개업로드는아직없다.

## R03-1 완료 후 갱신

2026-11-13. 아르테미아의 최저 외모 조건만5이상으로 수정했다. 다른R03비교식은 아직 미수정이다. 현재WORK `d64c350069b0a2a1d9e659cf9aad11c401af77bca532329ceafe19347c862ec5`。 [R03-1 기록](<G:/somi/JO9sa/records/release-r03a-artemia-beauty-20261113/REPORT_KO.md>)

## R03-2 완료 후 갱신

아르테미아 기술8종의 최저4/5 설정과 알려진 옛 콜백 갱신을 반영했다. 실제 엔진120검사 통과. 다른 R03 문제는 아직 미완료다. 현재 WORK `91e77edf089f2f6ba9caaacc310dbe419280570ffe1e3a3e8b37c186b3bf1c99`. [기록](<G:/somi/JO9sa/records/release-r03b-artemia-skills-20261113/REPORT_KO.md>).

## R03-3 완료 후 갱신

아르테미아의 기존 특성최저1 요구를 실제 납품에 연결했다. 색정광/정액 중독 허용, 발견 여부는 미요구. 실제 엔진43검사·14사례 가격/평가 보존. 현재 WORK `4f2b7a9d4d664800a541e3cd47211c14f9097172279eeb410e473e99e7bc5c78`. R03 나머지는 별도 검토한다. [기록](<G:/somi/JO9sa/records/release-r03c-artemia-trait-20261113/REPORT_KO.md>).

## R03-4 완료 후 갱신

레시의 감수성3이하 상한 및 알려진 옛 저장 선호 갱신을 반영했다. 실제 엔진30검사·7사례 가격/평가 보존. 다른 요구는 미수정이다. 현재 WORK `1efab505a81b43dced363335b265f5f9399570ed07ac7b59a1e979cfe4ac059f`. [기록](<G:/somi/JO9sa/records/release-r03d-leshiy-sensitivity-20261113/REPORT_KO.md>).

## R03-5 완료 후 갱신

레시만 체력4이상 검사 및 알려진 옛 요구 캐시를 반영했다. 실제 엔진33검사·8사례 가격/평가 보존. 다른 고객은 유지. 현재 WORK `7b4c58faba105d70eae09ea12f3aa7307d3a044081210f3cdb007212ad5f5b58`. [기록](<G:/somi/JO9sa/records/release-r03e-leshiy-stamina-20261113/REPORT_KO.md>).

## R03-6 완료 후 갱신

레시의 기존 무명 요구를 인지도0 납품 조건으로 연결했다. 실제 엔진31검사·8사례 가격/평가 보존. 다른 조건은 유지했다. 현재 WORK `2c40888317e25b9453ca0efc60fa79321cbca9b0b18318d2584e6908e42f0605`. [기록](<G:/somi/JO9sa/records/release-r03f-leshiy-unknown-20261113/REPORT_KO.md>).

## R03-7 완료 후 갱신

레시 감수성 최저1을 실제 검사에 연결해1~3만 허용한다. 실제 엔진35검사·9사례 가격/평가 보존. 현재 WORK `1ec9e14bb0e95716f4041362e25c811351862a5a7c022615663fc9c42f1fa2b4`. [기록](<G:/somi/JO9sa/records/release-r03g-leshiy-sensitivity-min-20261113/REPORT_KO.md>).

## R03-8 완료 후 갱신

키키모라 최저 외모4 정의와 알려진 옛 요구 콜백을 맞췄다. 실제 엔진30검사·7사례 가격/평가 보존. 기술 비교식 등 잔여는 미수정이다. 현재 WORK `081e888dc651332c5683a24cd0f6366c2d1f2751b30e9f406f4428427a5230a1`. [기록](<G:/somi/JO9sa/records/release-r03h-kikimora-beauty-20261113/REPORT_KO.md>).

## R03-9 완료 후 갱신

키키모라 선호8종 최저4/5 반영. 실제 엔진75검사·18사례 가격/평가 보존. 현재 WORK `24614a24b457fc2bc21f93397ef754d672b48a42a49a410838985c6650ac501f`. [기록](<G:/somi/JO9sa/records/release-r03i-kikimora-preferences-20261113/REPORT_KO.md>).

## R10-1 후속

확정 버전 표시11곳2.4.2 반영. 문구 검증만이며 엔진/화면/배포 구성은 별도다. 현재WORK `348e5e27990db9d01a6490b433cb3a396993337f24d8df3625e24da04e6f110a`.

## R04/G02 해결

등록기준을사용자와확정한뒤9개복합요구문의/목표/기존대기일연결완료. 새배열0·엔진105검사·공식재생/멱등/역검증. 현재WORK `515d7cda23ff5cfc4118d3de277bd2afeacc8052e001f82d30aee7df8c8edaf7`. 이전G02미반영/관찰자료는수정전기록이다. [기록](<G:/somi/JO9sa/records/release-r04-repeat-goals-20261113/REPORT_KO.md>)

R04최종본 089c5be52b032298c8d8cd1fedf447906f0ac0cbc23c24d2a24eda28a668d2d4 · 문의문자열키9항목/새배열0·최종엔진105검사.

## R05/G04 해결

일반직업반말잔여를제거하고사용자추가요청의인물말투속성을반영했다. 엔진188검사·공식재생/멱등/역검증·코드검토완료. 현재WORK `3ada1bd1e28921edc0d3ae930783a405b68cbde4065aaa912362510032a2c4b5`. 이전G04미반영기록은수정전근거다. [기록](<G:/somi/JO9sa/records/release-r05-voice-policy-20261113/REPORT_KO.md>)

## R03-10/Q03 완료

키키모라만young형수락연결·다른고객규약유지. 엔진72검사·36가격평가보존. 현재WORK `7db751c87928f4f9d65f208c30834092b6e6886b83c4758dd578ed6707cff239`. [기록](<G:/somi/JO9sa/records/release-r03j-kikimora-young-20261113/REPORT_KO.md>)
